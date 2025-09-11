import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI with API key from environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Get the model with enhanced configuration
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
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
  parts: [{
    text: `You are a helpful, accurate, and friendly AI assistant. Follow these guidelines:
- Provide clear, concise answers with examples when helpful
- Use proper markdown formatting for code blocks and lists
- Be conversational but professional
- If you're unsure about something, say so rather than guessing
- Break down complex topics into digestible parts
- Always aim to be helpful while being honest about limitations`
  }]
};

/**
 * Convert internal message format to Gemini chat format
 * @param {Array} messages - Internal conversation history
 * @returns {Array} - Gemini-formatted chat history
 */
function formatMessagesForGemini(messages) {
  return messages
    .filter(msg => !msg.isError && !msg.isStreaming) // Skip error and streaming messages
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
}

/**
 * Handle Gemini API errors with user-friendly messages
 * @param {Error} error - The original error
 * @throws {Error} - User-friendly error message
 */
function handleGeminiError(error) {
  console.error('Gemini API Error:', error);
  
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('api_key') || errorMessage.includes('key')) {
    throw new Error('Invalid API key. Please check your Gemini API configuration.');
  } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    throw new Error('API quota exceeded. Please try again later.');
  } else if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
    throw new Error('Message blocked by safety filters. Please rephrase your message.');
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    throw new Error('Network error. Please check your connection and try again.');
  } else if (errorMessage.includes('overloaded') || errorMessage.includes('busy')) {
    throw new Error('Service is temporarily overloaded. Please try again in a moment.');
  } else {
    throw new Error('Failed to generate response. Please try again.');
  }
}

/**
 * Check response for safety blocks or other issues
 * @param {Object} result - Gemini API result
 * @throws {Error} - If response is blocked or invalid
 */
function validateGeminiResponse(result) {
  const candidate = result.response.candidates?.[0];
  
  if (!candidate) {
    throw new Error('No response generated. Please try rephrasing your message.');
  }
  
  const finishReason = candidate.finishReason;
  
  switch (finishReason) {
    case 'SAFETY':
      throw new Error('Message blocked due to safety settings. Please rephrase your message.');
    case 'RECITATION':
      throw new Error('Response blocked due to potential copyright issues. Please try a different question.');
    case 'MAX_TOKENS':
      throw new Error('Response was truncated due to length. Please ask for a shorter response.');
    case 'STOP':
      // Normal completion
      break;
    default:
      if (finishReason && finishReason !== 'STOP') {
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
export async function generateGeminiResponse(prompt, conversationHistory = [], customInstruction = null) {
  try {
    // Build chat history with system instruction
    const chatHistory = [
      customInstruction ? { role: "user", parts: [{ text: customInstruction }] } : SYSTEM_INSTRUCTION,
      ...formatMessagesForGemini(conversationHistory)
    ];

    // Start chat session with history
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send the new message
    const result = await chat.sendMessage(prompt);
    
    // Validate response
    validateGeminiResponse(result);
    
    const response = result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response received. Please try again.');
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
export async function generateGeminiStreamResponse(prompt, conversationHistory = [], onChunk, customInstruction = null) {
  try {
    // Build chat history with system instruction
    const chatHistory = [
      customInstruction ? { role: "user", parts: [{ text: customInstruction }] } : SYSTEM_INSTRUCTION,
      ...formatMessagesForGemini(conversationHistory)
    ];

    // Start chat session with history
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send message and get streaming response
    const result = await chat.sendMessageStream(prompt);
    let fullResponse = '';
    let hasContent = false;
    
    try {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        
        if (chunkText && chunkText.trim()) {
          hasContent = true;
          fullResponse += chunkText;
          
          // Call the chunk callback for real-time updates
          if (onChunk && typeof onChunk === 'function') {
            onChunk(chunkText);
          }
        }
      }
      
      // Ensure we got some content
      if (!hasContent || !fullResponse.trim()) {
        throw new Error('Empty response received from streaming. Please try again.');
      }
      
      // Signal end of stream
      if (onChunk && typeof onChunk === 'function') {
        onChunk(null, true); // null chunk with isComplete flag
      }
      
      // Validate the final response
      const finalResult = await result.response;
      validateGeminiResponse({ response: finalResult });
      
      return fullResponse.trim();
      
    } catch (streamError) {
      // Handle streaming-specific errors
      console.error('Streaming error:', streamError);
      
      // If we have partial content, return it
      if (fullResponse.trim()) {
        if (onChunk && typeof onChunk === 'function') {
          onChunk(null, true, 'Stream interrupted but partial response available');
        }
        return fullResponse.trim();
      }
      
      throw streamError;
    }
    
  } catch (error) {
    // Signal error to UI
    if (onChunk && typeof onChunk === 'function') {
      onChunk(null, true, error.message);
    }
    handleGeminiError(error);
  }
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
      return 'No conversation to summarize';
    }

    // Filter out system messages and errors
    const relevantMessages = messages.filter(msg => 
      !msg.isError && !msg.isStreaming && msg.text && msg.text.trim()
    );

    if (relevantMessages.length === 0) {
      return 'No meaningful conversation to summarize';
    }

    // Build conversation text
    const conversation = relevantMessages
      .slice(-20) // Last 20 messages to avoid token limits
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
    
    const prompt = `Please provide a brief summary of this conversation in ${maxLength} characters or less. Focus on the main topics discussed and key information exchanged:\n\n${conversation}`;
    
    // Use regular generation for summaries (not streaming)
    const result = await model.generateContent(prompt);
    validateGeminiResponse(result);
    
    const summary = result.response.text().trim();
    
    // Ensure summary isn't too long
    if (summary.length > maxLength) {
      return summary.substring(0, maxLength - 3) + '...';
    }
    
    return summary;
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return 'Unable to generate summary - please try again later';
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
      return 'New Chat';
    }

    // Get first few meaningful messages
    const relevantMessages = messages
      .filter(msg => !msg.isError && !msg.isStreaming && msg.text && msg.text.trim())
      .slice(0, 4); // First 4 messages

    if (relevantMessages.length === 0) {
      return 'New Chat';
    }

    const conversation = relevantMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
    
    const prompt = `Based on this conversation start, generate a short, descriptive title (3-5 words max) that captures the main topic:\n\n${conversation}\n\nTitle:`;
    
    const result = await model.generateContent(prompt);
    validateGeminiResponse(result);
    
    let title = result.response.text().trim();
    
    // Clean up the title
    title = title.replace(/^(Title:|Chat about|Discussion on|Conversation about)/i, '').trim();
    title = title.replace(/['"]/g, '').trim();
    
    // Ensure title isn't too long
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || 'New Chat';
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return 'New Chat';
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
    
    if (typeof imageData === 'string') {
      // Base64 string
      imagePart = {
        inlineData: {
          data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
          mimeType: 'image/jpeg' // Default, should be detected properly
        }
      };
    } else if (imageData instanceof File) {
      // File object - convert to base64
      const base64 = await fileToBase64(imageData);
      imagePart = {
        inlineData: {
          data: base64,
          mimeType: imageData.type || 'image/jpeg'
        }
      };
    } else {
      throw new Error('Invalid image data format');
    }

    // Build chat history
    const chatHistory = [
      SYSTEM_INSTRUCTION,
      ...formatMessagesForGemini(conversationHistory)
    ];

    // For multimodal, we need to use generateContent directly
    // as startChat doesn't fully support mixed content yet
    const result = await model.generateContent([
      { text: prompt },
      imagePart
    ]);
    
    validateGeminiResponse(result);
    
    const text = result.response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response received. Please try again.');
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
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
