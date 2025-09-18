import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Header from "../component/Header";
import SettingsPanel from "../component/SettingsPanel/SettingsPanel";
import "../styles/LibraryView.css";

// Default images for initial library
const defaultLibraryImages = [
  "https://images.unsplash.com/photo-1506748687210-3f83e20b5a4a?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522199710521-72d69614c702?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1080&auto=format&fit=crop&q=80",
];

export default function LibraryView({ initialImages = defaultLibraryImages }) {
  const [images] = useState(initialImages); // no add/search
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Get context from MainLayout for sidebar controls and theme
  const context = useOutletContext();
  const {
    isMobile,
    onToggleSidebar,
    sidebarCollapsed,
    darkMode,
    toggleDarkMode,
    currentUser,
    chats,
    onRestoreChat,
    onPermanentlyDeleteChat,
  } = context || {};

  // Listen for settings panel open event
  useEffect(() => {
    const openSettingsHandler = () => setShowSettings(true);
    window.addEventListener("open-settings", openSettingsHandler);
    return () => window.removeEventListener("open-settings", openSettingsHandler);
  }, []);

  const handleCloseSettings = () => setShowSettings(false);
  const handleSettingsChange = () => {}; // Simplified since theme is managed by MainLayout

  const openModal = (img) => setSelectedImage(img);
  const closeModal = () => setSelectedImage(null);

  return (
    <div
      className={`library-view ${darkMode ? "dark" : "light"}`}
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      {/* Header with theme toggle */}
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onToggleSidebar={onToggleSidebar}
        isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed}
        activeChat={{ title: "Image Library" }}
        messages={[]}
        showExportMenu={false}
      />

      <div className="library-content" style={{ flex: 1, overflow: "auto" }}>
        <div className="image-grid">
          {images.map((img, i) => (
            <div
              key={i}
              className="image-item"
              onClick={() => openModal(img)}
              style={{
                background: darkMode ? "var(--card-bg-dark, #2a2a2a)" : "var(--card-bg, #fff)",
              }}
            >
              <img src={img} alt={`Library item ${i + 1}`} />
              <div className="image-overlay">
                <span>View</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={closeModal}>
              &times;
            </span>
            <img src={selectedImage} alt="Selected" />
          </div>
        </div>
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={handleCloseSettings}
        darkMode={darkMode}
        theme={darkMode ? "dark" : "light"}
        setTheme={toggleDarkMode}
        currentUser={currentUser}
        onSettingsChange={handleSettingsChange}
        chats={chats || []}
        onRestoreChat={onRestoreChat}
        onPermanentlyDeleteChat={onPermanentlyDeleteChat}
      />
    </div>
  );
}
