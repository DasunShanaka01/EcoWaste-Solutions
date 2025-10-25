import React from 'react';

/**
 * Component responsible for displaying map legend
 * Single Responsibility: Map legend display
 */
const MapLegend = () => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      <h3 className="text-xs font-bold text-gray-700 uppercase mb-3">Map Legend</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div>
          <span className="text-xs text-gray-700">Priority (Highest Capacity)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
          <span className="text-xs text-gray-700">Waste Account</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
          <span className="text-xs text-gray-700">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
          <span className="text-xs text-gray-700">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow-sm"></div>
          <span className="text-xs text-gray-700">Special Collection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-sm"></div>
          <span className="text-xs text-gray-700">Your Location</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
