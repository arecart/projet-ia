'use client';
import React from 'react';

function Header({ user, onDashboard }) {
  return (
    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
      {onDashboard && (
        <button
          onClick={onDashboard}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300"
        >
          Dashboard
        </button>
      )}
    </div>
  );
}

export default Header;
