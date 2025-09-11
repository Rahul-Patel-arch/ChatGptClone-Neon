import React from 'react';
import { motion } from 'framer-motion';
import { Send, Sun, Moon } from 'lucide-react';
import gptIcon from '../assets/gpt-clone-icon.png';
import MarkdownMessage from './MarkdownMessage';

export default function ChatArea({ 
  darkMode, 
  toggleDarkMode,
  sidebarCollapsed,
  messages, 
  message,
  setMessage,
  onSendMessage,
  currentUser,
  isLoading = false
}) {
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
      <div className={`d-flex justify-content-between align-items-center p-3 shadow border-bottom ${
        darkMode ? 'bg-dark border-dark' : 'bg-white'
      }`}>
        <div className="d-flex align-items-center gap-2">
          {sidebarCollapsed && (
            <>
              <img src={gptIcon} alt="ChatClone Logo" style={{width: '24px', height: '24px'}} />
              <h2 className="h5 fw-bold mb-0 gradient-text">ChatClone</h2>
            </>
          )}
        </div>
        <button
          onClick={toggleDarkMode}
          className={`btn rounded-3 ${
            darkMode ? 'btn-outline-light' : 'btn-outline-secondary'
          }`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-4" style={{backgroundColor: 'transparent'}}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-4 shadow-sm mb-3 ${
              msg.role === "user"
                ? "ms-auto text-white"
                : msg.isError
                ? "bg-danger bg-opacity-10 border border-danger"
                : darkMode ? "bg-dark text-white border border-secondary" : "bg-light"
            }`}
            style={{
              maxWidth: '80%',
              background: msg.role === "user" 
                ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' 
                : msg.isError
                ? undefined
                : undefined
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
            className={`p-3 rounded-4 shadow-sm mb-3 ${
              darkMode ? "bg-dark text-white border border-secondary" : "bg-light"
            }`}
            style={{ maxWidth: '80%' }}
          >
            <div className="d-flex align-items-center">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="ms-2 small text-muted">Gemini is thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className={`p-3 border-top ${darkMode ? 'bg-dark border-dark' : 'bg-white'}`}>
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
            className={`form-control rounded-3 ${
              darkMode ? 'bg-dark text-white border-secondary' : ''
            }`}
          />
          <button
            onClick={() => {
              if (!isLoading && message.trim()) {
                onSendMessage(message);
                setMessage('');
              }
            }}
            disabled={!message.trim() || isLoading}
            className="btn text-white rounded-3"
            style={{
              background: (!message.trim() || isLoading) 
                ? '#6c757d' 
                : 'linear-gradient(to right, #3b82f6, #8b5cf6)', 
              border: 'none'
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
      
      {/* CSS for animations */}
      <style jsx>{`
        .typing-indicator {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        
        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #6c757d;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        .typing-cursor {
          animation: blink 1s infinite;
          color: #6c757d;
          margin-left: 2px;
        }
        
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
