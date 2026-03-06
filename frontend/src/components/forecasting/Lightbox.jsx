import React, { useEffect } from "react";

export default function Lightbox({ url, caption, onClose }) {
  useEffect(() => {
    if (!url) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden z-10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-lg hover:bg-black/60 transition-colors"
        >
          &times;
        </button>
        <img
          src={url}
          alt={caption || "Enlarged view"}
          className="max-w-full max-h-[80vh] object-contain"
        />
        {caption && (
          <div className="px-5 py-3 text-sm text-center text-gray-600 border-t">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
