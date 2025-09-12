import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import "./SettingsPanel.css";

const SettingsPanel = ({ 
  isOpen = true, 
  onClose = () => {}, 
  darkMode = false, 
  theme = "system", 
  setTheme = () => {}, 
  currentUser = { name: "John Doe", email: "john@example.com" },
  onSettingsChange = () => {}
}) => {
  // Settings state management with ChatGPT-style defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(`chatgpt_settings_${currentUser?.email || 'default'}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return {
          appearance: {
            theme: theme || "system",
            fontSize: "medium",
            reduceMotion: false,
            ...parsed.appearance
          },
          customInstructions: {
            responseStyle: "",
            aboutYou: "",
            enabled: false,
            ...parsed.customInstructions
          },
          language: parsed.language || "en",
          privacy: {
            saveHistory: true,
            analytics: true,
            shareData: false,
            ...parsed.privacy
          },
          advanced: {
            codeHighlighting: true,
            streamResponses: true,
            showTimestamps: false,
            ...parsed.advanced
          }
        };
      } catch {
        return getDefaultSettings();
      }
    }
    return getDefaultSettings();
  });

  // ChatGPT-style expandable sections (collapsed by default like ChatGPT)
  const [expandedSections, setExpandedSections] = useState({
    appearance: false,
    customInstructions: false,
    language: false,
    privacy: false,
    advanced: false
  });

  // Toggle section expansion with smooth animation (ChatGPT behavior)
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Default settings helper
  function getDefaultSettings() {
    return {
      appearance: {
        theme: "system",
        fontSize: "medium",
        reduceMotion: false
      },
      customInstructions: {
        responseStyle: "",
        aboutYou: "",
        enabled: false
      },
      language: "en",
      privacy: {
        saveHistory: true,
        analytics: true,
        shareData: false
      },
      advanced: {
        codeHighlighting: true,
        streamResponses: true,
        showTimestamps: false
      }
    };
  }

  // Theme change handler
  const handleThemeChange = (newTheme) => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, theme: newTheme }
    }));
    setTheme(newTheme);
  };

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`chatgpt_settings_${currentUser?.email || 'default'}`, JSON.stringify(settings));
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }, [settings, currentUser?.email, onSettingsChange]);

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className={`settings-container ${settings.appearance.theme === 'dark' || (settings.appearance.theme === 'system' && darkMode) ? 'dark' : 'light'}`}
        onClick={(e) => e.stopPropagation()}
        data-theme={settings.appearance.theme}
      >
        {/* ChatGPT-style Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="close-button" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          
          {/* Appearance Section */}
          <div className={`settings-section ${expandedSections.appearance ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('appearance')}>
              <div className="section-title">
                <h3>Appearance</h3>
                <span className="section-description">Customize how ChatGPT looks</span>
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
                    <p>Choose how ChatGPT looks to you</p>
                  </div>
                  <div className="theme-buttons">
                    <button
                      className={`theme-button ${settings.appearance.theme === 'light' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      Light
                    </button>
                    <button
                      className={`theme-button ${settings.appearance.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      Dark
                    </button>
                    <button
                      className={`theme-button ${settings.appearance.theme === 'system' ? 'active' : ''}`}
                      onClick={() => handleThemeChange('system')}
                    >
                      System
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Instructions Section */}
          <div className={`settings-section ${expandedSections.customInstructions ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('customInstructions')}>
              <div className="section-title">
                <h3>Custom instructions</h3>
                <span className="section-description">Customize ChatGPT's responses</span>
              </div>
              <div className="section-toggle">
                {expandedSections.customInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            
            {expandedSections.customInstructions && (
              <div className="section-content">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Enable custom instructions</h4>
                    <p>ChatGPT will consider your custom instructions for every conversation</p>
                  </div>
                  <label className="toggle-switch-modern">
                    <input
                      type="checkbox"
                      checked={settings.customInstructions.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        customInstructions: { ...prev.customInstructions, enabled: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider-modern"></span>
                  </label>
                </div>
                
                {settings.customInstructions.enabled && (
                  <>
                    <div className="setting-group">
                      <label className="input-label">What would you like ChatGPT to know about you to provide better responses?</label>
                      <textarea
                        value={settings.customInstructions.aboutYou}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          customInstructions: { ...prev.customInstructions, aboutYou: e.target.value }
                        }))}
                        placeholder="e.g., I'm a software developer working on web applications..."
                        rows={3}
                        className="settings-textarea"
                      />
                    </div>

                    <div className="setting-group">
                      <label className="input-label">How would you like ChatGPT to respond?</label>
                      <textarea
                        value={settings.customInstructions.responseStyle}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          customInstructions: { ...prev.customInstructions, responseStyle: e.target.value }
                        }))}
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
          <div className={`settings-section ${expandedSections.privacy ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('privacy')}>
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
                    <p>Save new chats on this browser to appear in your history and improve our models</p>
                  </div>
                  <label className="toggle-switch-modern">
                    <input
                      type="checkbox"
                      checked={settings.privacy.saveHistory}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, saveHistory: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider-modern"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Improve the model for everyone</h4>
                    <p>Allow your conversations to be used to improve our models</p>
                  </div>
                  <label className="toggle-switch-modern">
                    <input
                      type="checkbox"
                      checked={settings.privacy.analytics}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, analytics: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider-modern"></span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className={`settings-section ${expandedSections.advanced ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('advanced')}>
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
                  <label className="toggle-switch-modern">
                    <input
                      type="checkbox"
                      checked={settings.advanced.codeHighlighting}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, codeHighlighting: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider-modern"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Stream responses</h4>
                    <p>Show responses as they're being generated</p>
                  </div>
                  <label className="toggle-switch-modern">
                    <input
                      type="checkbox"
                      checked={settings.advanced.streamResponses}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        advanced: { ...prev.advanced, streamResponses: e.target.checked }
                      }))}
                    />
                    <span className="toggle-slider-modern"></span>
                  </label>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ChatGPT-style Footer */}
        <div className="settings-footer">
          <div className="settings-version">QuantumChat v1.0.0</div>
          <div className="settings-links">
            <a href="#terms">Terms of use</a>
            <a href="#privacy">Privacy policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
