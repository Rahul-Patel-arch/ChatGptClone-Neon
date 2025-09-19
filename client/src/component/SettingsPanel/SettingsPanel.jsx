import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Archive, RotateCcw, Trash2, Calendar } from "lucide-react";
import "./SettingsPanel.css";

const SettingsPanel = ({
  isOpen = true,
  onClose = () => {},
  darkMode = false,
  theme = "system",
  setTheme = () => {},
  currentUser = { name: "John Doe", email: "john@example.com" },
  onSettingsChange = () => {},
  chats = [],
  onRestoreChat = () => {},
  onPermanentlyDeleteChat = () => {},
}) => {
  // Settings state management with ChatGPT-style defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(
      `chatgpt_settings_${currentUser?.email || "default"}`
    );
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return {
          appearance: {
            theme: theme || "system",
            fontSize: "medium",
            reduceMotion: false,
            ...parsed.appearance,
          },
          customInstructions: {
            responseStyle: "",
            aboutYou: "",
            enabled: false,
            ...parsed.customInstructions,
          },
          language: parsed.language || "en",
          privacy: {
            saveHistory: true,
            analytics: true,
            shareData: false,
            ...parsed.privacy,
          },
          advanced: {
            codeHighlighting: true,
            streamResponses: true,
            showTimestamps: false,
            ...parsed.advanced,
          },
        };
      } catch {
        return getDefaultSettings();
      }
    }
    return getDefaultSettings();
  });

  // Keep internal theme selection in sync with incoming prop (e.g., when header toggles theme)
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme },
    }));
  }, [theme]);

  // ChatGPT-style expandable sections (appearance expanded by default for better UX)
  const [expandedSections, setExpandedSections] = useState({
    appearance: true,
    customInstructions: false,
    language: false,
    privacy: false,
    advanced: false,
    archive: false,
  });

  // Toggle section expansion with smooth animation (ChatGPT behavior)
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Default settings helper
  function getDefaultSettings() {
    return {
      appearance: {
        theme: "system",
        fontSize: "medium",
        reduceMotion: false,
      },
      customInstructions: {
        responseStyle: "",
        aboutYou: "",
        enabled: false,
      },
      language: "en",
      privacy: {
        saveHistory: true,
        analytics: true,
        shareData: false,
      },
      advanced: {
        codeHighlighting: true,
        streamResponses: true,
        showTimestamps: false,
      },
    };
  }

  // Theme change handler
  const handleThemeChange = (newTheme) => {
    // If already selected, do nothing (prevents accidental toggling when a toggle function is passed)
    if (settings.appearance.theme === newTheme) return;
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme: newTheme },
    }));
    setTheme(newTheme);
  };

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `chatgpt_settings_${currentUser?.email || "default"}`,
        JSON.stringify(settings)
      );
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    } catch (error) {
      console.warn("Failed to save settings:", error);
    }
  }, [settings, currentUser?.email, onSettingsChange]);

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className={`settings-container ${darkMode ? "dark" : ""}`}
        onClick={(e) => e.stopPropagation()}
        data-theme={settings.appearance.theme}
      >
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="close-button" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* Appearance Section - Expanded by default for better visibility */}
          <div className={`settings-section ${expandedSections.appearance ? "expanded" : ""}`}>
            <div className="section-header" onClick={() => toggleSection("appearance")}>
              <div className="section-title">
                <h3>Appearance</h3>
                <span className="section-description">Customize how QuantumChat looks</span>
              </div>
              <div className="section-toggle">
                {expandedSections.appearance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedSections.appearance && (
              <div className="section-content">
                <div className="setting-group">
                  <div className="setting-label">
                    <h4>Theme</h4>
                    <p>Choose how QuantumChat looks to you</p>
                  </div>
                  <div className="theme-buttons">
                    <button
                      className={`btn ${settings.appearance.theme === "light" ? "primary" : "secondary"}`}
                      onClick={() => handleThemeChange("light")}
                    >
                      Light
                    </button>
                    <button
                      className={`btn ${settings.appearance.theme === "dark" ? "primary" : "secondary"}`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      Dark
                    </button>
                    <button
                      className={`btn ${settings.appearance.theme === "system" ? "primary" : "secondary"}`}
                      onClick={() => handleThemeChange("system")}
                    >
                      System
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Instructions Section */}
          <div
            className={`settings-section ${expandedSections.customInstructions ? "expanded" : ""}`}
          >
            <div className="section-header" onClick={() => toggleSection("customInstructions")}>
              <div className="section-title">
                <h3>Custom instructions</h3>
                <span className="section-description">Customize QuantumChat's responses</span>
              </div>
              <div className="section-toggle">
                {expandedSections.customInstructions ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </div>

            {expandedSections.customInstructions && (
              <div className="section-content">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Enable custom instructions</h4>
                    <p>QuantumChat will consider your custom instructions for every conversation</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.customInstructions.enabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          customInstructions: {
                            ...prev.customInstructions,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {settings.customInstructions.enabled && (
                  <>
                    <div className="setting-group">
                      <label className="input-label">
                        What would you like QuantumChat to know about you to provide better
                        responses?
                      </label>
                      <textarea
                        value={settings.customInstructions.aboutYou}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            customInstructions: {
                              ...prev.customInstructions,
                              aboutYou: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g., I'm a software developer working on web applications..."
                        rows={3}
                        className="settings-textarea"
                      />
                    </div>

                    <div className="setting-group">
                      <label className="input-label">
                        How would you like QuantumChat to respond?
                      </label>
                      <textarea
                        value={settings.customInstructions.responseStyle}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            customInstructions: {
                              ...prev.customInstructions,
                              responseStyle: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g., Be concise and provide code examples when relevant..."
                        rows={3}
                        className="settings-textarea"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Data Controls Section */}
          <div className={`settings-section ${expandedSections.privacy ? "expanded" : ""}`}>
            <div className="section-header" onClick={() => toggleSection("privacy")}>
              <div className="section-title">
                <h3>Data controls</h3>
                <span className="section-description">Manage your data and privacy</span>
              </div>
              <div className="section-toggle">
                {expandedSections.privacy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedSections.privacy && (
              <div className="section-content">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Chat history & training</h4>
                    <p>
                      Save new chats on this browser to appear in your history and improve our
                      models
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.privacy.saveHistory}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          privacy: { ...prev.privacy, saveHistory: e.target.checked },
                        }))
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Improve the model for everyone</h4>
                    <p>Allow your conversations to be used to improve our models</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.privacy.analytics}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          privacy: { ...prev.privacy, analytics: e.target.checked },
                        }))
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Archive Section */}
          <div className={`settings-section ${expandedSections.archive ? "expanded" : ""}`}>
            <div className="section-header" onClick={() => toggleSection("archive")}>
              <div className="section-title">
                <h3>Archived Chats</h3>
                <span className="section-description">Manage your archived conversations</span>
              </div>
              <div className="section-toggle">
                {expandedSections.archive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedSections.archive && (
              <div className="section-content">
                <div className="archive-stats">
                  <div className="stat-item">
                    <Archive size={16} />
                    <span>{chats.filter((chat) => chat.archived).length} archived chats</span>
                  </div>
                </div>

                <div className="archived-chats-list">
                  {chats.filter((chat) => chat.archived).length === 0 ? (
                    <div className="empty-archive">
                      <Archive size={24} className="empty-icon" />
                      <p>No archived chats</p>
                      <small>Archived conversations will appear here</small>
                    </div>
                  ) : (
                    chats
                      .filter((chat) => chat.archived)
                      .sort(
                        (a, b) =>
                          new Date(b.archivedAt || b.createdAt) -
                          new Date(a.archivedAt || a.createdAt)
                      )
                      .map((chat) => (
                        <div key={chat.id} className="archived-chat-item">
                          <div className="chat-info">
                            <div className="chat-title-archive">{chat.title}</div>
                            <div className="chat-meta">
                              <Calendar size={12} />
                              <span>
                                Archived{" "}
                                {chat.archivedAt
                                  ? new Date(chat.archivedAt).toLocaleDateString()
                                  : "recently"}
                              </span>
                            </div>
                          </div>
                          <div className="chat-actions">
                            <button
                              className="btn-icon restore"
                              onClick={() => onRestoreChat(chat.id)}
                              title="Restore chat"
                              aria-label="Restore chat"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => {
                                const message = "Permanently delete this chat? This action cannot be undone.";
                                if (window.confirm(message)) {
                                  onPermanentlyDeleteChat(chat.id);
                                }
                              }}
                              title="Delete permanently"
                              aria-label="Delete chat permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {chats.filter((chat) => chat.archived).length > 0 && (
                  <div className="archive-actions">
                    <button
                      className="btn secondary"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Restore all archived chats? They will appear in your chat list again."
                          )
                        ) {
                          chats
                            .filter((chat) => chat.archived)
                            .forEach((chat) => onRestoreChat(chat.id));
                        }
                      }}
                    >
                      <RotateCcw size={14} />
                      Restore All
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => {
                        const message = "Permanently delete all archived chats? This action cannot be undone.";
                        if (window.confirm(message)) {
                          chats
                            .filter((chat) => chat.archived)
                            .forEach((chat) => onPermanentlyDeleteChat(chat.id));
                        }
                      }}
                    >
                      <Trash2 size={14} />
                      Delete All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className={`settings-section ${expandedSections.advanced ? "expanded" : ""}`}>
            <div className="section-header" onClick={() => toggleSection("advanced")}>
              <div className="section-title">
                <h3>Advanced</h3>
                <span className="section-description">Advanced features and settings</span>
              </div>
              <div className="section-toggle">
                {expandedSections.advanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedSections.advanced && (
              <div className="section-content">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Code highlighting</h4>
                    <p>Enable syntax highlighting for code blocks</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.advanced.codeHighlighting}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          advanced: { ...prev.advanced, codeHighlighting: e.target.checked },
                        }))
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Stream responses</h4>
                    <p>Show responses as they're being generated</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.advanced.streamResponses}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          advanced: { ...prev.advanced, streamResponses: e.target.checked },
                        }))
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <div className="settings-version">QuantumChat v1.0.0</div>
          <div className="settings-links">
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#help">Help</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
