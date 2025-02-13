'use client';
import React from 'react';

function ChatInput({ value, onChange, onSend, loading, quotaExhausted }) {
  const maxChars = 100000;
  const remainingChars = maxChars - value.length;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          maxLength={maxChars}
          className="flex-1 p-3 border rounded-md bg-gray-800 text-white placeholder-gray-400 min-h-[50px] transition duration-300 custom-scrollbar scrollbar-hide"
        ></textarea>
        <button
          onClick={onSend}
          disabled={loading || quotaExhausted || !value.trim() || value.length > maxChars}
          className={`px-4 py-3 rounded-md transition duration-300 ${
            loading || quotaExhausted || !value.trim() || value.length > maxChars
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
          } text-white`}
        >
          {loading ? 'Envoi...' : quotaExhausted ? 'Quota épuisé' : 'Envoyer'}
        </button>
      </div>
      <div className="text-xs text-gray-400 text-right">
        {remainingChars} caractères restants
      </div>
    </div>
  );
}

export default ChatInput;
