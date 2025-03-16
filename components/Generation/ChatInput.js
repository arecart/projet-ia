'use client';
import React, { useRef, useEffect, useState } from 'react';

function ChatInput({ value, onChange, onSend, loading, quotaExhausted, supportsImage }) {
  const maxChars = 100000;
  const remainingChars = maxChars - value.length;
  const textareaRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex gap-2 items-center">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          maxLength={maxChars}
          className="flex-1 p-3 border rounded-md bg-gray-800 text-white placeholder-gray-400 resize-none overflow-auto custom-scrollbar scrollbar-hide"
          style={{ minHeight: '50px', maxHeight: '300px' }}
        />
        {supportsImage ? (
          <label className="cursor-pointer w-10 h-10 bg-gray-700 rounded-full hover:bg-gray-600 flex items-center justify-center relative group">
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <span className="text-white text-xl">📷</span>
            <div className="absolute hidden group-hover:block bg-gray-700 text-white text-xs rounded p-1 mt-12">
              Attacher une image
            </div>
          </label>
        ) : (
          <div className="relative group">
            <span className="text-gray-500 text-xl cursor-not-allowed">📷</span>
            <div className="absolute hidden group-hover:block bg-gray-700 text-white text-xs rounded p-1 mt-2">
              Ce modèle ne supporte pas les images
            </div>
          </div>
        )}
        <button
          onClick={() => {
            onSend(selectedImage);
            setSelectedImage(null);
          }}
          disabled={loading || quotaExhausted || (!value.trim() && !selectedImage)}
          className={`px-4 py-3 rounded-md transition duration-300 ${
            loading || quotaExhausted || (!value.trim() && !selectedImage)
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
          } text-white`}
        >
          {loading ? 'Envoi...' : quotaExhausted ? 'Quota épuisé' : 'Envoyer'}
        </button>
      </div>
      {selectedImage && (
        <div className="flex items-center gap-2 mt-2">
          <img src={selectedImage} alt="Image sélectionnée" className="w-16 h-16 object-cover rounded" />
          <span className="text-sm text-gray-400">Image sélectionnée</span>
          <span className="text-green-500">✓ Attachée</span>
          <button onClick={() => setSelectedImage(null)} className="text-red-500">X</button>
        </div>
      )}
      <div className="text-xs text-gray-400 text-right">
        {remainingChars} caractères restants
      </div>
    </div>
  );
}

export default ChatInput;