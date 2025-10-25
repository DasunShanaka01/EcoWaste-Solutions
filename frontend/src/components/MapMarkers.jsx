import React from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';

/**
 * Component responsible for rendering map markers
 * Single Responsibility: Map marker rendering
 */
const MapMarkers = ({ 
  markers, 
  liveLocation, 
  selectedLocation, 
  activeMarker, 
  onMarkerClick, 
  onInfoWindowClose,
  isLoaded 
}) => {
  const liveLocationIcon = isLoaded && window.google ? {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeWeight: 3,
    strokeColor: "white",
  } : {};

  const renderMarker = (marker, index) => {
    const isWasteAccount = marker.type === 'waste_account';
    const isSpecial = marker.type === 'special';
    const isHighestCapacity = index === 0;
    
    const status = marker.status ? String(marker.status).toLowerCase() : null;
    
    if (isHighestCapacity && isWasteAccount) {
      return (
        <Marker
          key={marker.pointId || index}
          position={{ lat: marker.lat, lng: marker.lng }}
          label={{
            text: "1",
            color: "white",
            fontWeight: "bold",
            fontSize: "14px"
          }}
          icon={isLoaded && window.google ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 22,
            fillColor: "#FF6B35",
            fillOpacity: 1,
            strokeWeight: 4,
            strokeColor: "white",
          } : {}}
          onClick={() => onMarkerClick({ ...marker, isHighestCapacity: true })}
          animation={isLoaded && window.google ? window.google.maps.Animation.BOUNCE : undefined}
        />
      );
    }
    
    const iconUrl = isWasteAccount
      ? `http://maps.google.com/mapfiles/ms/icons/blue-dot.png`
      : isSpecial
      ? `http://maps.google.com/mapfiles/ms/icons/purple-dot.png`
      : (status === 'complete'
        ? `http://maps.google.com/mapfiles/ms/icons/green-dot.png`
        : `http://maps.google.com/mapfiles/ms/icons/red-dot.png`);

    return (
      <Marker
        key={marker.pointId || index}
        position={{ lat: marker.lat, lng: marker.lng }}
        label={{
          text: String(index + 1),
          color: "white",
          fontWeight: "bold",
          fontSize: "12px"
        }}
        icon={{ url: iconUrl }}
        onClick={() => onMarkerClick(marker)}
      />
    );
  };

  return (
    <>
      {/* Regular markers */}
      {markers.map((marker, index) => renderMarker(marker, index))}

      {/* Live location marker */}
      {liveLocation && (
        <Marker 
          position={liveLocation}
          icon={liveLocationIcon}
          title="Your Current Location"
          onClick={() => onMarkerClick({ ...liveLocation, address: 'You are here', type: 'live' })}
        />
      )}

      {/* Selected location marker */}
      {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
        <Marker 
          position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
          icon={isLoaded && window.google ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#FF6B6B",
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "white",
          } : {}}
          title="Selected Location"
          onClick={() => onMarkerClick({ 
            lat: selectedLocation.latitude, 
            lng: selectedLocation.longitude, 
            address: selectedLocation.address || 'Selected Location', 
            type: 'selected' 
          })}
        />
      )}

      {/* InfoWindow */}
      {activeMarker && (
        <InfoWindow 
          position={{ lat: activeMarker.lat, lng: activeMarker.lng }} 
          onCloseClick={onInfoWindowClose}
          options={isLoaded && window.google ? {
            pixelOffset: new window.google.maps.Size(0, -10)
          } : {}}
        >
          <div className="p-2" style={{ maxWidth: 260 }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {activeMarker.isHighestCapacity && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    PRIORITY
                  </span>
                )}
              </div>
            </div>

            <div className="mb-3">
              <h3 className="font-bold text-gray-900 text-base mb-1">
                {activeMarker.type === 'waste_account' ? '🗑️ Waste Account' : 
                 activeMarker.type === 'special' ? '⭐ Special Collection' : 
                 activeMarker.type === 'live' ? '📍 Current Location' : 
                 activeMarker.type === 'selected' ? '📌 Selected Location' : 
                 '📦 Collection Point'}
              </h3>
              <p className="text-sm text-gray-600">{activeMarker.address || 'No address available'}</p>
            </div>

            {activeMarker.pointId && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-xs text-gray-600">ID: <span className="font-mono font-semibold">{String(activeMarker.pointId)}</span></span>
              </div>
            )}

            {activeMarker.capacity !== undefined && activeMarker.capacity !== null && (
              <div className={`flex items-center justify-between p-3 rounded-lg ${activeMarker.isHighestCapacity ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2">
                  <svg className={`w-5 h-5 ${activeMarker.isHighestCapacity ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className={`text-sm font-semibold ${activeMarker.isHighestCapacity ? 'text-orange-800' : 'text-green-800'}`}>
                    Capacity
                  </span>
                </div>
                <span className={`text-lg font-bold ${activeMarker.isHighestCapacity ? 'text-orange-600' : 'text-green-600'}`}>
                  {activeMarker.capacity.toFixed(1)}%
                </span>
              </div>
            )}

            {activeMarker.isHighestCapacity && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold">Visit this location first!</span>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default MapMarkers;
