import React, { useState } from "react";
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

  const openModal = (img) => setSelectedImage(img);
  const closeModal = () => setSelectedImage(null);

  return (
    <div className={`library-view ${darkMode ? 'dark' : 'light'}`}>
      <h2 className="library-title">Image Library</h2>

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
