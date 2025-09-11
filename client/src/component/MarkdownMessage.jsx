import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const MarkdownMessage = ({ children, darkMode }) => {
  const [copiedStates, setCopiedStates] = useState({});

  const copyToClipboard = async (text, codeId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [codeId]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [codeId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          const codeContent = String(children).replace(/\n$/, '');
          const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

          if (!inline && language) {
            return (
              <div className="position-relative">
                <div className="d-flex justify-content-between align-items-center p-2 border-bottom" 
                     style={{ 
                       backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                       borderColor: darkMode ? '#4a5568' : '#e2e8f0'
                     }}>
                  <span className="small text-muted">{language}</span>
                  <button
                    onClick={() => copyToClipboard(codeContent, codeId)}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    style={{ fontSize: '12px' }}
                  >
                    {copiedStates[codeId] ? (
                      <>
                        <Check size={12} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={darkMode ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0 0 8px 8px',
                    fontSize: '14px'
                  }}
                  {...props}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code 
              className={`${darkMode ? 'text-info' : 'text-primary'}`}
              style={{
                backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.9em'
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <div className="mb-3">{children}</div>;
        },
        blockquote({ children }) {
          return (
            <blockquote 
              className="border-start border-3 ps-3 my-3"
              style={{
                borderColor: darkMode ? '#4a5568' : '#e2e8f0',
                backgroundColor: darkMode ? '#2d3748' : '#f8f9fa',
                padding: '12px'
              }}
            >
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="table-responsive mb-3">
              <table className={`table table-sm ${darkMode ? 'table-dark' : ''}`}>
                {children}
              </table>
            </div>
          );
        },
        h1({ children }) {
          return <h4 className="mt-3 mb-2">{children}</h4>;
        },
        h2({ children }) {
          return <h5 className="mt-3 mb-2">{children}</h5>;
        },
        h3({ children }) {
          return <h6 className="mt-2 mb-2">{children}</h6>;
        },
        ul({ children }) {
          return <ul className="mb-2 ps-3">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="mb-2 ps-3">{children}</ol>;
        },
        li({ children }) {
          return <li className="mb-1">{children}</li>;
        },
        p({ children }) {
          return <p className="mb-2">{children}</p>;
        },
        a({ href, children }) {
          return (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className={darkMode ? 'text-info' : 'text-primary'}
            >
              {children}
            </a>
          );
        }
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;
