import React from 'react';
import { motion } from 'framer-motion';
import { Send, Sun, Moon } from 'lucide-react';
import gptIcon from '../assets/gpt-clone-icon.png';
import MarkdownMessage from './MarkdownMessage';
import ThemeToggleButton from './ThemeToggleButton';

export default function ChatArea({ 
  darkMode, 
  toggleDarkMode,
  sidebarCollapsed,
  messages, 
  message,
  setMessage,
  onSendMessage,
  currentUser,
  isLoading = false,
  forceUpdate = 0
}) {
  // Use the forceUpdate prop to force re-render on theme change
  React.useEffect(() => {
    console.log('ChatArea re-rendered due to forceUpdate:', forceUpdate);
  }, [forceUpdate]);
  return (
    <div 
      className="flex-grow-1 d-flex flex-column"
      style={{
        marginLeft: sidebarCollapsed ? '60px' : '280px',
        transition: 'margin-left 0.3s ease-in-out',
        width: '100%'
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3 shadow border-bottom"
           style={{
             backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
             borderBottomColor: darkMode ? '#404040' : '#e8e7f3',
             color: darkMode ? '#ffffff' : '#2d2d2d'
           }}>
        <div className="d-flex align-items-center gap-2">
          {sidebarCollapsed && (
            <>
              <img src={gptIcon} alt="QuantumChat Logo" style={{width: '24px', height: '24px'}} />
              <h2 className="h5 fw-bold mb-0 gradient-text">QuantumChat</h2>
            </>
          )}
        </div>
        <ThemeToggleButton isDarkMode={darkMode} onToggle={toggleDarkMode} />
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-4" style={{
        backgroundColor: darkMode ? '#1a1a1a' : '#f8f7fc'
      }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-4 shadow-sm mb-3 ${
              msg.role === "user"
                ? ""
                : msg.isError
                ? "bg-danger bg-opacity-10 border border-danger"
                : ""
            }`}
            style={{
              maxWidth: '80%',
              background: msg.role === "user" 
                ? (darkMode ? '#312e81' : '#f0efff')
                : msg.isError
                ? undefined
                : (darkMode ? '#242424' : '#ffffff'),
              color: msg.role === "user" 
                ? (darkMode ? '#ffffff' : '#4F46E5') 
                : (darkMode ? '#ffffff' : '#2d2d2d'),
              border: msg.role === "user" 
                ? (darkMode ? '1px solid #4F46E5' : '1px solid #B7B1F2')
                : (darkMode ? '1px solid #404040' : '1px solid #e8e7f3'),
              marginLeft: msg.role === "user" ? 'auto' : undefined,
              fontWeight: msg.role === "user" ? '500' : undefined
            }}
          >
            <div className="fw-medium">
              {msg.role === 'user' ? (
                <>
                  {msg.text}
                  {msg.isStreaming && (
                    <span className="typing-cursor">|</span>
                  )}
                </>
              ) : (
                <>
                  <MarkdownMessage darkMode={darkMode}>
                    {typeof msg.text === 'string' ? msg.text : String(msg.text)}
                  </MarkdownMessage>
                  {msg.isStreaming && (
                    <span className="typing-cursor">|</span>
                  )}
                </>
              )}
            </div>
            <div className={`small mt-1 ${
              msg.role === "user" 
                ? "text-white-50" 
                : msg.isError
                ? "text-danger"
                : darkMode 
                  ? "text-light opacity-75" 
                  : "text-muted"
            }`}>
              {msg.time}
              {msg.isError && " • Error"}
              {msg.isStreaming && " • Typing..."}
            </div>
          </motion.div>
        ))}
        
        {/* Typing Indicator */}
        {isLoading && messages.length > 0 && !messages[messages.length - 1].isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-4 shadow-sm mb-3"
            style={{ 
              maxWidth: '80%',
              backgroundColor: darkMode ? '#242424' : '#ffffff',
              border: darkMode ? '1px solid #404040' : '1px solid #e8e7f3',
              color: darkMode ? '#ffffff' : '#2d2d2d'
            }}
          >
            <div className="d-flex align-items-center">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="ms-2 small" style={{color: darkMode ? '#cccccc' : '#666666'}}>Gemini is thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-top" style={{
        backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
        borderTopColor: darkMode ? '#404040' : '#e8e7f3'
      }}>
        <div className="d-flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading && message.trim()) {
                onSendMessage(message);
                setMessage('');
              }
            }}
            placeholder="Type your message..."
            disabled={isLoading}
            className="form-control rounded-3"
            style={{
              backgroundColor: darkMode ? '#242424' : '#ffffff',
              border: darkMode ? '1px solid #404040' : '1px solid #e8e7f3',
              color: darkMode ? '#ffffff' : '#2d2d2d'
            }}
          />
          <button
            onClick={() => {
              if (!isLoading && message.trim()) {
                onSendMessage(message);
                setMessage('');
              }
            }}
            disabled={!message.trim() || isLoading}
            className="btn rounded-3"
            style={{
              background: (!message.trim() || isLoading) 
                ? (darkMode ? '#404040' : '#f5f5f5')
                : (darkMode ? '#4F46E5' : '#B7B1F2'), 
              border: 'none',
              color: (!message.trim() || isLoading) 
                ? (darkMode ? '#666666' : '#999999')
                : 'white',
              padding: '12px',
              boxShadow: (!message.trim() || isLoading) ? 'none' : (darkMode ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(183, 177, 242, 0.08)'),
              transition: 'all 0.2s ease'
            }}
          >
            {isLoading ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
