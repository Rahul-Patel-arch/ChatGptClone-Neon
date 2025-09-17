import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "../styles/LibraryView.css";

// Default images for initial library
const defaultLibraryImages = [
  "https://images.unsplash.com/photo-1506748687210-3f83e20b5a4a?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522199710521-72d69614c702?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1080&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1080&auto=format&fit=crop&q=80",
];

export default function LibraryView({ initialImages = defaultLibraryImages, darkMode }) {
  const [images] = useState(initialImages); // no add/search
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Get context from MainLayout for sidebar controls
  const context = useOutletContext();
  const { isMobile, onToggleSidebar } = context || {};

  const openModal = (img) => setSelectedImage(img);
  const closeModal = () => setSelectedImage(null);

  return (
    <div className={`library-view ${darkMode ? 'dark' : 'light'}`}>
      {/* Header with mobile hamburger button */}
      <div className="library-header">
        {isMobile && (
          <button
            className="mobile-hamburger-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <h2 className="library-title">Image Library</h2>
      </div>

      <div className="library-content">
        <div className="image-grid">
          {images.map((img, i) => (
            <div
              key={i}
              className="image-item"
              onClick={() => openModal(img)}
              style={{
                background: darkMode ? 'var(--card-bg-dark, #2a2a2a)' : 'var(--card-bg, #fff)'
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
    </div>
  );
}
