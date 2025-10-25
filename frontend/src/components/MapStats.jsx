import React from 'react';

/**
 * Component responsible for displaying map statistics
 * Single Responsibility: Map statistics display
 */
const MapStats = ({ markers }) => {
  if (!markers || markers.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-600">Total Locations</p>
          <p className="text-xl font-bold text-gray-900">{markers.length}</p>
        </div>
      </div>
    </div>
  );
};

export default MapStats;
