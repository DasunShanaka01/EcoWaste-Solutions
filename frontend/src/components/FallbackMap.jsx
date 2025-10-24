import React from 'react';

const FallbackMap = ({ markers = [], liveLocation = null, onLocationSelect = null, selectedLocation = null }) => {
  const handleLocationClick = (lat, lng) => {
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  return (
    <div className="relative">
      {/* Map Legend */}
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

      {/* Map Stats */}
      {markers.length > 0 && (
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
      )}

      {/* Fallback Map Container */}
      <div className="w-full h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-gray-300 relative overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-6 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>

        {/* Center Point */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>

        {/* Markers */}
        {markers.map((marker, index) => {
          const isWasteAccount = marker.type === 'waste_account';
          const isSpecial = marker.type === 'special';
          const isHighestCapacity = index === 0;
          const status = marker.status ? String(marker.status).toLowerCase() : null;
          
          const getMarkerColor = () => {
            if (isHighestCapacity && isWasteAccount) return 'bg-orange-500';
            if (isWasteAccount) return 'bg-blue-500';
            if (isSpecial) return 'bg-purple-500';
            if (status === 'complete') return 'bg-green-500';
            return 'bg-red-500';
          };

          const getMarkerPosition = () => {
            // Simple positioning based on index
            const x = 20 + (index * 15) % 60;
            const y = 20 + (index * 20) % 60;
            return { x: `${x}%`, y: `${y}%` };
          };

          const position = getMarkerPosition();

          return (
            <div
              key={marker.pointId || index}
              className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${getMarkerColor()}`}
              style={{ left: position.x, top: position.y }}
              onClick={() => handleLocationClick(marker.lat, marker.lng)}
              title={`${marker.address || 'Location'} - ${marker.capacity ? `${marker.capacity}% capacity` : 'No capacity data'}`}
            >
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {index + 1}
              </div>
            </div>
          );
        })}

        {/* Live Location Marker */}
        {liveLocation && (
          <div
            className="absolute w-8 h-8 bg-blue-400 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: '50%', top: '50%' }}
            onClick={() => handleLocationClick(liveLocation.lat, liveLocation.lng)}
            title="Your Current Location"
          >
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
              📍
            </div>
          </div>
        )}

        {/* Selected Location Marker */}
        {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
          <div
            className="absolute w-6 h-6 bg-pink-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: '60%', top: '40%' }}
            onClick={() => handleLocationClick(selectedLocation.latitude, selectedLocation.longitude)}
            title="Selected Location"
          >
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
              📌
            </div>
          </div>
        )}

        {/* Fallback Message */}
        <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">
            <strong>Fallback Map View</strong> - Google Maps API not available
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click on markers to interact with locations
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FallbackMap);
