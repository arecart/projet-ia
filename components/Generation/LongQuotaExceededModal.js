'use client';
import React from 'react';

function LongQuotaExceededModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-zoomIn"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-2xl relative animate-zoomInContent"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-200 mb-4">Limite atteinte</h2>
        <p className="text-gray-400 mb-6">
          Vous avez atteint la limite de messages longs pour ce modèle.
          Vous ne pouvez pas envoyer de message de plus de 10 000 caractères.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          OK
        </button>
      </div>
      <style jsx>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-zoomIn { animation: zoomIn 0.3s ease-out forwards; }
        @keyframes zoomOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.8); }
        }
        .animate-zoomOut { animation: zoomOut 0.3s ease-in forwards; }
      `}</style>
    </div>
  );
}

export default LongQuotaExceededModal;