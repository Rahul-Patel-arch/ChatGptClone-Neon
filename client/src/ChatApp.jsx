import React, { useState } from 'react';
import Sidebar from './component/sidebar';
import ChatArea from './component/ChatArea';
import AuthForm from './component/AuthForm';
import SettingsPanel from './component/SettingsPanel/SettingsPanel';
import { 
  generateGeminiResponse, 
  generateGeminiStreamResponse, 
  isGeminiConfigured,
  generateConversationTitle,
  summarizeConversation 
} from './services/geminiService';

export default function ChatApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("system");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "Hello! I'm powered by Google's Gemini AI. How can I help you today?", 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [input, setInput] = useState("");
  
  const [chats] = useState([
    { title: "How to learn React?", id: 1 },
    { title: "JavaScript tips", id: 2 },
    { title: "CSS Grid layout", id: 3 },
    { title: "Python for beginners", id: 4 },
    { title: "Node.js best practices", id: 5 },
  ]);

  const [activeChatId, setActiveChatId] = useState(1);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleSettingsChange = (newSettings) => {
    // Handle settings changes
    if (newSettings.appearance?.theme !== theme) {
      setTheme(newSettings.appearance.theme);
    }
    
    // You can add more settings handling here
    console.log('Settings updated:', newSettings);
  };

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = {
        role: "user",
        text: input.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);
      const currentInput = input.trim();
      setInput("");
      setIsLoading(true);
      setStreamingResponse('');
      
      try {
        // Check if Gemini is configured
        if (!isGeminiConfigured()) {
          throw new Error('Gemini API key not configured. Please check your environment variables.');
        }

        // Add temporary AI message for streaming
        const tempAiMessage = {
          role: "ai",
          text: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: true
        };
        
        setMessages(prev => [...prev, tempAiMessage]);
        
        // Generate streaming response with enhanced error handling
        const fullResponse = await generateGeminiStreamResponse(
          currentInput, 
          messages, // conversation history
          (chunk, isComplete, errorMessage) => {
            if (errorMessage) {
              // Handle streaming error
              console.error('Streaming error:', errorMessage);
              return;
            }
            
            if (isComplete) {
              // Stream completed successfully
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.isStreaming) {
                  lastMessage.isStreaming = false;
                }
                return newMessages;
              });
              return;
            }
            
            if (chunk) {
              // Update streaming response with new chunk
              setStreamingResponse(prev => prev + chunk);
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.isStreaming) {
                  lastMessage.text = (lastMessage.text || '') + chunk;
                }
                return newMessages;
              });
            }
          }
        );
        
        // Finalize the AI response
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.isStreaming) {
            lastMessage.text = fullResponse;
            lastMessage.isStreaming = false;
          }
          return newMessages;
        });

        // Auto-generate title for new conversations (after first AI response)
        if (messages.length <= 2) {
          try {
            const title = await generateConversationTitle([...messages, { role: "ai", text: fullResponse }]);
            // You could save this title to localStorage or a database here
            console.log('Generated conversation title:', title);
          } catch (error) {
            console.warn('Failed to generate conversation title:', error);
          }
        }
        
      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Add error message
        const errorMessage = {
          role: "ai",
          text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        };
        
        // Remove temporary streaming message and add error message
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1].isStreaming) {
            newMessages[newMessages.length - 1] = errorMessage;
          } else {
            newMessages.push(errorMessage);
          }
          return newMessages;
        });
      } finally {
        setIsLoading(false);
        setStreamingResponse('');
      }
    }
  };

  const handleNewChat = () => {
    setMessages([
      { 
        role: "ai", 
        text: "Hello! I'm powered by Google's Gemini AI. How can I help you today?", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ]);
    setActiveChatId(null); // Clear active chat for new chat
    setStreamingResponse('');
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    // In a real app, you'd load the chat messages here
    setMessages([
      { role: "ai", text: `Welcome back to chat ${chatId}!`, time: "10:00 AM" },
    ]);
  };

  // Apply dark mode and theme to body
  React.useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let shouldBeDark = darkMode;
    
    if (theme === "system") {
      shouldBeDark = systemPrefersDark;
    } else if (theme === "dark") {
      shouldBeDark = true;
    } else if (theme === "light") {
      shouldBeDark = false;
    }
    
    setDarkMode(shouldBeDark);
    document.body.className = shouldBeDark ? 'bg-dark text-white' : 'bg-light text-dark';
  }, [theme]);

  if (!loggedIn) {
    return (
      <AuthForm 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className={`d-flex ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`} style={{height: '100vh', overflow: 'hidden'}}>
      <Sidebar
        darkMode={darkMode}
        chats={chats}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentUser={currentUser}
        onSelectChat={handleSelectChat}
        activeChatId={activeChatId}
        onSettings={handleSettings}
      />
      
      <ChatArea
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        sidebarCollapsed={sidebarCollapsed}
        messages={messages}
        message={input}
        setMessage={setInput}
        onSendMessage={handleSend}
        currentUser={currentUser}
        isLoading={isLoading}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={handleCloseSettings}
        darkMode={darkMode}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
