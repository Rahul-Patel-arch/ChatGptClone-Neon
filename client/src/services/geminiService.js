import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI with API key from environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Simple in-memory cooldown tracking for 429 quota responses
let geminiCooldownUntil = 0; // epoch ms when we can next send

// Simple FIFO request queue to serialize Gemini calls and avoid burst 429s
const geminiRequestQueue = [];
let geminiQueueProcessing = false;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Internal processor: runs queued tasks one-by-one respecting cooldown.
 */
async function processGeminiQueue() {
  if (geminiQueueProcessing) return;
  geminiQueueProcessing = true;
  try {
    while (geminiRequestQueue.length) {
      const { task, resolve, reject, onQueuedStatus } = geminiRequestQueue.shift();
      // Wait out any cooldown before firing the request
      let rl = getGeminiRateLimitInfo();
      if (rl.coolingDown) {
        // Inform streaming callbacks (if provided) that we're still queued
        if (typeof onQueuedStatus === 'function') {
          onQueuedStatus(`Waiting ${rl.retryAfterSeconds}s due to rate limit...`);
        }
      }
      while (rl.coolingDown) {
        // Sleep in short intervals so UI countdown stays responsive
        const waitMs = Math.min(1000, Math.max(250, (geminiCooldownUntil - Date.now())));
        await sleep(waitMs);
        rl = getGeminiRateLimitInfo();
      }
      try {
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }
  } finally {
    geminiQueueProcessing = false;
  }
}

/**
 * Enqueue a Gemini request (standard or streaming). Returns a promise resolved with task result.
 * @param {Function} task async function to execute
 * @param {Function} onQueuedStatus optional callback invoked with status strings while waiting
 */
function enqueueGeminiRequest(task, onQueuedStatus) {
  return new Promise((resolve, reject) => {
    geminiRequestQueue.push({ task, resolve, reject, onQueuedStatus });
    processGeminiQueue();
  });
}

/**
 * Queue introspection (optional UI usage)
 */
export function getGeminiQueueInfo() {
  return {
    length: geminiRequestQueue.length,
    processing: geminiQueueProcessing,
  };
}

/**
 * Check if we are currently under a rate-limit cooldown.
 * @returns {{ coolingDown: boolean, retryAfterSeconds: number }}
 */
export function getGeminiRateLimitInfo() {
  const now = Date.now();
  if (geminiCooldownUntil > now) {
    return { coolingDown: true, retryAfterSeconds: Math.max(0, Math.ceil((geminiCooldownUntil - now) / 1000)) };
  }
  return { coolingDown: false, retryAfterSeconds: 0 };
}

// Model and generation config from env (with safe defaults)
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL_NAME || "gemini-1.5-flash";
const TEMPERATURE =
  typeof import.meta.env.VITE_GEMINI_TEMPERATURE !== "undefined"
    ? Number(import.meta.env.VITE_GEMINI_TEMPERATURE)
    : 0.7;
const TOP_P =
  typeof import.meta.env.VITE_GEMINI_TOP_P !== "undefined"
    ? Number(import.meta.env.VITE_GEMINI_TOP_P)
    : 0.8;
const TOP_K =
  typeof import.meta.env.VITE_GEMINI_TOP_K !== "undefined"
    ? Number(import.meta.env.VITE_GEMINI_TOP_K)
    : 40;
const MAX_TOKENS =
  typeof import.meta.env.VITE_GEMINI_MAX_TOKENS !== "undefined"
    ? Number(import.meta.env.VITE_GEMINI_MAX_TOKENS)
    : 2049;

// Get the model with enhanced configuration
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: TEMPERATURE,
    topP: TOP_P,
    topK: TOP_K,
    maxOutputTokens: MAX_TOKENS,
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
});

// System instruction for consistent persona (like ChatGPT's custom instructions)
const SYSTEM_INSTRUCTION = {
  role: "user",
  parts: [
    {
      text: `You are a helpful, accurate, and friendly AI assistant. Follow these guidelines:
- Provide clear, concise answers with examples when helpful
- Use proper markdown formatting for code blocks and lists
- Be conversational but professional
- If you're unsure about something, say so rather than guessing
- Break down complex topics into digestible parts
- Always aim to be helpful while being honest about limitations`,
    },
  ],
};

/**
 * Convert internal message format to Gemini chat format
 * @param {Array} messages - Internal conversation history
 * @returns {Array} - Gemini-formatted chat history
 */
function formatMessagesForGemini(messages) {
  return messages
    .filter((msg) => !msg.isError && !msg.isStreaming) // Skip error and streaming messages
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));
}

/**
 * Handle Gemini API errors with user-friendly messages
 * @param {Error} error - The original error
 * @throws {Error} - User-friendly error message
 */
function handleGeminiError(error) {
  console.error("Gemini API Error:", error);

  const raw = error?.message || "";
  const errorMessage = raw.toLowerCase();

  // Extract retry delay if present (e.g., "Please retry in 58.510830182s" or RetryInfo JSON retryDelay:"58s")
  let retrySeconds = 0;
  const regexHuman = /retry in\s+([0-9]+(?:\.[0-9]+)?)s/i;
  const humanMatch = raw.match(regexHuman);
  if (humanMatch) retrySeconds = Math.max(retrySeconds, Math.ceil(parseFloat(humanMatch[1])));
  const retryJson = /"retryDelay"\s*:\s*"(\d+)s"/i.exec(raw);
  if (retryJson) retrySeconds = Math.max(retrySeconds, parseInt(retryJson[1], 10));

  // 429 / quota exceeded handling -> set cooldown
  if (errorMessage.includes("quota") || errorMessage.includes("limit") || errorMessage.includes("429")) {
    if (retrySeconds > 0) {
      geminiCooldownUntil = Date.now() + retrySeconds * 1000;
    } else {
      // fallback minimal backoff (30s) if not provided
      geminiCooldownUntil = Date.now() + 30_000;
    }
    const info = getGeminiRateLimitInfo();
    throw new Error(`Rate limit reached. Try again in ${info.retryAfterSeconds}s.`);
  }

  if (errorMessage.includes("api_key") || errorMessage.includes("key")) {
    throw new Error("Invalid API key. Please check your Gemini API configuration.");
  }
  if (errorMessage.includes("safety") || errorMessage.includes("blocked")) {
    throw new Error("Message blocked by safety filters. Please rephrase your message.");
  }
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    throw new Error("Network error. Please check your connection and try again.");
  }
  if (errorMessage.includes("overloaded") || errorMessage.includes("busy")) {
    throw new Error("Service is temporarily overloaded. Please try again in a moment.");
  }
  throw new Error("Failed to generate response. Please try again.");
}

/**
 * Check response for safety blocks or other issues
 * @param {Object} result - Gemini API result
 * @throws {Error} - If response is blocked or invalid
 */
function validateGeminiResponse(result) {
  const candidate = result.response.candidates?.[0];

  if (!candidate) {
    throw new Error("No response generated. Please try rephrasing your message.");
  }

  const finishReason = candidate.finishReason;

  switch (finishReason) {
    case "SAFETY":
      throw new Error("Message blocked due to safety settings. Please rephrase your message.");
    case "RECITATION":
      throw new Error(
        "Response blocked due to potential copyright issues. Please try a different question."
      );
    case "MAX_TOKENS":
      throw new Error("Response was truncated due to length. Please ask for a shorter response.");
    case "STOP":
      // Normal completion
      break;
    default:
      if (finishReason && finishReason !== "STOP") {
        throw new Error(`Response generation stopped: ${finishReason}. Please try again.`);
      }
  }
}

/**
 * Generate AI response using Gemini Chat Session API (instead of plain prompts)
 * @param {string} prompt - User's message/prompt
 * @param {Array} conversationHistory - Previous conversation for context
 * @param {string} customInstruction - Optional custom system instruction
 * @returns {Promise<string>} - AI response
 */
export async function generateGeminiResponse(
  prompt,
  conversationHistory = [],
  customInstruction = null,
  extraParts = [] // optional: additional parts like inlineData or text parts
) {
  try {
    // Pre-empt if under cooldown
    const rl = getGeminiRateLimitInfo();
    if (rl.coolingDown) {
      throw new Error(`Rate limit active. Try again in ${rl.retryAfterSeconds}s.`);
    }
    // Build chat history with system instruction
    const chatHistory = [
      customInstruction
        ? { role: "user", parts: [{ text: customInstruction }] }
        : SYSTEM_INSTRUCTION,
      ...formatMessagesForGemini(conversationHistory),
    ];

    // Start chat session with history
    const chat = model.startChat({
      history: chatHistory,
    });

    // Build parts: prompt text + any extra parts (e.g., image inlineData or additional text)
    const parts = [{ text: prompt }];
    if (Array.isArray(extraParts) && extraParts.length) {
      for (const p of extraParts) {
        if (!p) continue;
        // Accept either { text } or { inlineData } shapes; normalize older { inline_data } too
        if (p.text && typeof p.text === "string") parts.push({ text: p.text });
        else if (p.inlineData?.data && p.inlineData?.mimeType) parts.push({ inlineData: p.inlineData });
        else if (p.inline_data?.data && p.inline_data?.mime_type) parts.push({ inlineData: { data: p.inline_data.data, mimeType: p.inline_data.mime_type } });
      }
    }

    // Send the new message
    const result = await chat.sendMessage(parts);

    // Validate response
    validateGeminiResponse(result);

    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response received. Please try again.");
    }

    return text.trim();
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Generate streaming response with proper chat session API and graceful error handling
 * @param {string} prompt - User's message/prompt
 * @param {Array} conversationHistory - Previous conversation for context
 * @param {Function} onChunk - Callback for each chunk of response
 * @param {string} customInstruction - Optional custom system instruction
 * @returns {Promise<string>} - Complete response
 */
export async function generateGeminiStreamResponse(
  prompt,
  conversationHistory = [],
  onChunk,
  customInstruction = null,
  options = {},
  extraParts = [] // optional: additional parts like inlineData or text parts
) {
  try {
    // Pre-empt if under cooldown
    const rl = getGeminiRateLimitInfo();
    if (rl.coolingDown) {
      if (onChunk && typeof onChunk === 'function') {
        onChunk(null, true, `Rate limit active. Try again in ${rl.retryAfterSeconds}s.`);
      }
      return ""; // Return empty content; UI can show error message
    }
    // Build chat history with system instruction
    const chatHistory = [
      customInstruction
        ? { role: "user", parts: [{ text: customInstruction }] }
        : SYSTEM_INSTRUCTION,
      ...formatMessagesForGemini(conversationHistory),
    ];

    // Start chat session with history
    const chat = model.startChat({
      history: chatHistory,
    });

    // Build parts: prompt text + any extra parts
    const parts = [{ text: prompt }];
    if (Array.isArray(extraParts) && extraParts.length) {
      for (const p of extraParts) {
        if (!p) continue;
        if (p.text && typeof p.text === "string") parts.push({ text: p.text });
        else if (p.inlineData?.data && p.inlineData?.mimeType) parts.push({ inlineData: p.inlineData });
        else if (p.inline_data?.data && p.inline_data?.mime_type) parts.push({ inlineData: { data: p.inline_data.data, mimeType: p.inline_data.mime_type } });
      }
    }

    // Send message and get streaming response
    const result = await chat.sendMessageStream(parts);
    let fullResponse = "";
    let hasContent = false;
    const controller = options?.controller || null;

    try {
      for await (const chunk of result.stream) {
        // Allow cooperative cancellation from UI
        if (controller && controller.cancelled) {
          // Signal completion due to cancellation
          if (onChunk && typeof onChunk === "function") {
            onChunk(null, true, "cancelled");
          }
          break;
        }
        const chunkText = chunk.text();

        if (chunkText && chunkText.trim()) {
          hasContent = true;
          fullResponse += chunkText;

          // Call the chunk callback for real-time updates
          if (onChunk && typeof onChunk === "function") {
            onChunk(chunkText);
          }
        }
      }

      // Ensure we got some content (unless cancelled intentionally)
      if ((!hasContent || !fullResponse.trim()) && !(controller && controller.cancelled)) {
        throw new Error("Empty response received from streaming. Please try again.");
      }

      // Signal end of stream
      if (onChunk && typeof onChunk === "function") {
        onChunk(null, true); // null chunk with isComplete flag
      }

      // Validate the final response
      if (!(controller && controller.cancelled)) {
        const finalResult = await result.response;
        validateGeminiResponse({ response: finalResult });
      }

      return fullResponse.trim();
    } catch (streamError) {
      // Handle streaming-specific errors
      console.error("Streaming error:", streamError);

      // If we have partial content, return it
      if (fullResponse.trim()) {
        if (onChunk && typeof onChunk === "function") {
          onChunk(null, true, "Stream interrupted but partial response available");
        }
        return fullResponse.trim();
      }

      throw streamError;
    }
  } catch (error) {
    // Signal error to UI
    if (onChunk && typeof onChunk === "function") {
      onChunk(null, true, error.message);
    }
    handleGeminiError(error);
  }
}

/**
 * Queued variant of generateGeminiResponse to avoid parallel bursts.
 */
export function queuedGenerateGeminiResponse(
  prompt,
  conversationHistory = [],
  customInstruction = null,
  extraParts = []
) {
  return enqueueGeminiRequest(() => generateGeminiResponse(prompt, conversationHistory, customInstruction, extraParts));
}

/**
 * Queued variant of generateGeminiStreamResponse. The onChunk callback may receive a queued status message via error parameter with isComplete=false.
 */
export function queuedGenerateGeminiStreamResponse(
  prompt,
  conversationHistory = [],
  onChunk,
  customInstruction = null,
  options = {},
  extraParts = []
) {
  // Provide a minimal queued status notifier
  const queuedNotifier = (status) => {
    if (typeof onChunk === 'function') {
      // status as an errorMessage-like third param but not complete
      onChunk(null, false, status);
    }
  };
  return enqueueGeminiRequest(
    () => generateGeminiStreamResponse(prompt, conversationHistory, onChunk, customInstruction, options, extraParts),
    queuedNotifier
  );
}

/**
 * Validate API key configuration
 * @returns {boolean} - Whether API key is configured
 */
export function isGeminiConfigured() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return !!(apiKey && apiKey.length > 10); // Basic validation
}

/**
 * Get conversation summary (useful for long conversations)
 * @param {Array} messages - All conversation messages
 * @param {number} maxLength - Maximum length of summary
 * @returns {Promise<string>} - Summary of the conversation
 */
export async function summarizeConversation(messages, maxLength = 200) {
  try {
    if (!messages || messages.length === 0) {
      return "No conversation to summarize";
    }

    // Filter out system messages and errors
    const relevantMessages = messages.filter(
      (msg) => !msg.isError && !msg.isStreaming && msg.text && msg.text.trim()
    );

    if (relevantMessages.length === 0) {
      return "No meaningful conversation to summarize";
    }

    // Build conversation text
    const conversation = relevantMessages
      .slice(-20) // Last 20 messages to avoid token limits
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n");

    const prompt = `Please provide a brief summary of this conversation in ${maxLength} characters or less. Focus on the main topics discussed and key information exchanged:\n\n${conversation}`;

    // Use regular generation for summaries (not streaming)
    const result = await model.generateContent(prompt);
    validateGeminiResponse(result);

    const summary = result.response.text().trim();

    // Ensure summary isn't too long
    if (summary.length > maxLength) {
      return summary.substring(0, maxLength - 3) + "...";
    }

    return summary;
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    return "Unable to generate summary - please try again later";
  }
}

/**
 * Generate a title for the conversation based on the first few messages
 * @param {Array} messages - Conversation messages
 * @returns {Promise<string>} - Generated title
 */
export async function generateConversationTitle(messages) {
  try {
    if (!messages || messages.length === 0) {
      return "New Chat";
    }

    // Get first few meaningful messages
    const relevantMessages = messages
      .filter((msg) => !msg.isError && !msg.isStreaming && msg.text && msg.text.trim())
      .slice(0, 4); // First 4 messages

    if (relevantMessages.length === 0) {
      return "New Chat";
    }

    const conversation = relevantMessages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n");

    const prompt = `Based on this conversation start, generate a short, descriptive title (3-5 words max) that captures the main topic:\n\n${conversation}\n\nTitle:`;

    const result = await model.generateContent(prompt);
    validateGeminiResponse(result);

    let title = result.response.text().trim();

    // Clean up the title
    title = title.replace(/^(Title:|Chat about|Discussion on|Conversation about)/i, "").trim();
    title = title.replace(/['"]/g, "").trim();

    // Ensure title isn't too long
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }

    return title || "New Chat";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "New Chat";
  }
}

/**
 * Check if the model supports multimodal input (images)
 * @returns {boolean} - Whether multimodal is supported
 */
export function isMultimodalSupported() {
  return true; // Gemini 1.5 Flash supports images
}

/**
 * Generate response with image input (multimodal)
 * @param {string} prompt - Text prompt
 * @param {File|string} imageData - Image file or base64 data
 * @param {Array} conversationHistory - Previous conversation
 * @returns {Promise<string>} - AI response
 */
export async function generateGeminiResponseWithImage(prompt, imageData, conversationHistory = []) {
  try {
    // Convert image to proper format for Gemini
    let imagePart;

    if (typeof imageData === "string") {
      // Base64 string
      imagePart = {
        inlineData: {
          data: imageData.replace(/^data:image\/[a-z]+;base64,/, ""),
          mimeType: "image/jpeg", // Default, should be detected properly
        },
      };
    } else if (imageData instanceof File) {
      // File object - convert to base64
      const base64 = await fileToBase64(imageData);
      imagePart = {
        inlineData: {
          data: base64,
          mimeType: imageData.type || "image/jpeg",
        },
      };
    } else {
      throw new Error("Invalid image data format");
    }

    // Build chat history
    const _chatHistory = [SYSTEM_INSTRUCTION, ...formatMessagesForGemini(conversationHistory)];

    // For multimodal, we need to use generateContent directly
    // as startChat doesn't fully support mixed content yet
    const result = await model.generateContent([{ text: prompt }, imagePart]);

    validateGeminiResponse(result);

    const text = result.response.text();

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response received. Please try again.");
    }

    return text.trim();
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Helper function to convert File to base64
 * @param {File} file - Image file
 * @returns {Promise<string>} - Base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Convert a File into an extraPart suitable for Gemini (text or inlineData)
 * Supports small text files and common image types. For PDFs/DOCX, prefer client-side text extraction.
 * @param {File} file
 * @returns {Promise<object>} an object like { text } or { inlineData: { data, mimeType } }
 */
export async function fileToGeminiPart(file) {
  if (!(file instanceof File)) throw new Error("Expected a File");
  const MAX_BYTES = 4 * 1024 * 1024; // 4MB guard for frontend-only usage
  if (file.size > MAX_BYTES) {
    throw new Error("File too large. Please upload a file under 4MB or extract text first.");
  }

  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/")) {
    const base64 = await fileToBase64(file);
    return { inlineData: { data: base64, mimeType: file.type || "image/jpeg" } };
  }

  // Treat as text-like if small; default to UTF-8 read
  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = (err) => reject(err);
  });
  return { text };
}
