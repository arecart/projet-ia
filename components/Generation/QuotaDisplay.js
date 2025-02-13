'use client';
import React from 'react';

function QuotaDisplay({ quotaInfo }) {
  // Extraction des informations avec des valeurs par défaut
  const {
    current = 0,
    max = 1000000,
    remaining = 1000000,
    longCurrent = 0,
    longMax = 10,
    longRemaining = 10,
  } = quotaInfo || {};

  const percentageUsed = max > 0 ? (current / max) * 100 : 0;
  const longPercentageUsed = longMax > 0 ? (longCurrent / longMax) * 100 : 0;

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md w-full max-w-sm text-gray-100">
      {/* Quota normal */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Quota normal</span>
          <span className="text-xs text-gray-400">
            {current} / {max} (restant : {remaining})
          </span>
        </div>
        <div className="relative w-full h-2 bg-gray-600 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      </div>

      {/* Quota long */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Long Quota(10k)</span>
          <span className="text-xs text-gray-400">
            {longCurrent} / {longMax} (restant : {longRemaining})
          </span>
        </div>
        <div className="relative w-full h-2 bg-gray-600 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${longPercentageUsed}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default QuotaDisplay;
