import React from 'react';
import Map from './Map';

/**
 * Component responsible for displaying route overview
 * Single Responsibility: Route overview display
 */
const RouteOverview = ({ markers, stats, liveLocation, onStartRoute }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Waste Collection Route</h2>
      <p className="text-gray-600 mb-8">Start your collection route and visit waste bin locations to collect waste</p>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Waste Bin Locations</h3>
          <div className="text-sm text-gray-600">
            Capacity automatically updated on page refresh
          </div>
        </div>
        
        {/* Priority Location Indicator */}
        {markers.length > 0 && (() => {
          // Sort markers by capacity descending (same logic as Map component)
          const sortedMarkers = [...markers].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
          const highestCapacityMarker = sortedMarkers[0];
          console.log('RouteOverview - Sorted markers by capacity:', sortedMarkers.map(m => ({ id: m.pointId, capacity: m.capacity, address: m.address })));
          console.log('RouteOverview - Highest capacity marker:', highestCapacityMarker);
          
          return (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-orange-800">Priority Collection Point</span>
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">HIGHEST CAPACITY</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    {highestCapacityMarker?.address || 'Location details not available'} - 
                    Capacity: {highestCapacityMarker?.capacity?.toFixed(1) || '0.0'}%
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
        
        <Map markers={markers} liveLocation={liveLocation} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Bins</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-700 mb-1">Active Bins</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6 text-center">
          <p className="text-sm text-yellow-700 mb-1">Available</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.remaining}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Ready to Start Collection</h3>
            <p className="text-sm text-blue-800">
              Click the button below to begin your collection route. You will visit waste bin locations to collect waste. GPS permission is required for location tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteOverview;
