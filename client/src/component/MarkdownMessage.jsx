import React, { Suspense } from "react";
import ReactMarkdown from "react-markdown";
// Lazy-load syntax highlighter only when rendering a code block
const LazyHighlighter = React.lazy(() => import("react-syntax-highlighter").then(m => ({ default: m.Prism })));
const loadStyle = (dark) => dark
  ? import("react-syntax-highlighter/dist/esm/styles/prism").then(m => m.oneDark)
  : import("react-syntax-highlighter/dist/esm/styles/prism").then(m => m.oneLight);
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const MarkdownMessage = ({ children, darkMode }) => {
  const [copiedStates, setCopiedStates] = useState({});

  // Reset copied badges when the message content changes
  React.useEffect(() => {
    setCopiedStates({});
  }, [children]);

  const hashString = (str) => {
    let hash = 5381; // djb2
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
      hash |= 0; // force 32-bit
    }
    // convert to unsigned and base36 for brevity
    return (hash >>> 0).toString(36);
  };

  // Stable ID generator: assigns unique, order-based IDs per block for this message
  const getCodeId = React.useMemo(() => {
    let idx = 0;
    return (lang, content) => {
      const key = `${lang}::${content}`;
      const hashed = hashString(key);
      return `code-${idx++}-${hashed}`;
    };
  }, []);

  const copyToClipboard = async (text, codeId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [codeId]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [codeId]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "";
          const codeContent = String(children).replace(/\n$/, "");
          const codeId = getCodeId(language || "text", codeContent);

          if (!inline) {
            const langLabel = language || "text";
            // Load theme style lazily per block
            const [style, setStyle] = React.useState(null);
            React.useEffect(() => {
              let alive = true;
              loadStyle(darkMode).then((s) => alive && setStyle(s));
              return () => {
                alive = false;
              };
            }, [darkMode]);
            return (
              <div className="code-block-container position-relative">
                <div
                  className="code-block-header"
                  style={{
                    backgroundColor: darkMode ? "#2d3748" : "#f6f8fa",
                    borderColor: darkMode ? "#4a5568" : "#d0d7de",
                    borderBottom: `1px solid ${darkMode ? "#4a5568" : "#d0d7de"}`,
                    borderRadius: "8px 8px 0 0",
                    fontSize: "13px",
                    color: darkMode ? "#e2e8f0" : "#656d76",
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <span className="code-language" style={{ fontFamily: "monospace" }}>
                    {langLabel}
                  </span>
                  <div
                    className="code-header-actions"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginLeft: "auto",
                    }}
                  >
                    {copiedStates[codeId] && (
                      <span className="code-copied-badge" aria-live="polite">
                        Copied
                      </span>
                    )}
                    <button
                      onClick={() => copyToClipboard(codeContent, codeId)}
                      className="code-copy-btn"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        border: "none",
                        borderRadius: "4px",
                        width: "22px",
                        height: "22px",
                        color: darkMode ? "#a0aec0" : "#656d76",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease, color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode ? "#4a5568" : "#e6eaef";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      aria-label={copiedStates[codeId] ? "Copied!" : "Copy code"}
                      title={copiedStates[codeId] ? "Copied!" : "Copy code"}
                    >
                      {copiedStates[codeId] ? (
                        <Check size={12} style={{ color: "#22c55e" }} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
                <Suspense fallback={<div style={{ padding: 12, fontFamily: 'monospace' }}>{codeContent}</div>}>
                  {style ? (
                    <LazyHighlighter
                      style={style}
                      language={language || "text"}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: "0 0 8px 8px",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        backgroundColor: darkMode ? "#1a202c" : "#f6f8fa",
                      }}
                      {...props}
                    >
                      {codeContent}
                    </LazyHighlighter>
                  ) : (
                    <div style={{ padding: 12, fontFamily: 'monospace', backgroundColor: darkMode ? "#1a202c" : "#f6f8fa", borderRadius: "0 0 8px 8px" }}>
                      {codeContent}
                    </div>
                  )}
                </Suspense>
              </div>
            );
          }

          return (
            <code
              className={`${darkMode ? "text-info" : "text-primary"}`}
              style={{
                backgroundColor: darkMode ? "#2d3748" : "#f7fafc",
                padding: "2px 4px",
                borderRadius: "4px",
                fontSize: "0.9em",
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <div className="code-pre-wrapper">{children}</div>;
        },
        blockquote({ children }) {
          return (
            <blockquote
              className="border-start border-3 ps-3 my-3"
              style={{
                borderColor: darkMode ? "#4a5568" : "#e2e8f0",
                backgroundColor: darkMode ? "#2d3748" : "#f8f9fa",
                padding: "12px",
              }}
            >
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="table-responsive mb-3">
              <table className={`table table-sm ${darkMode ? "table-dark" : ""}`}>{children}</table>
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
              className={darkMode ? "text-info" : "text-primary"}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;
