import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
  overflow: 'hidden'
};

const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612
};

const Map = ({ markers = [], path = [], liveLocation = null, onLocationSelect = null, selectedLocation = null }) => {
  console.log('Map component received markers:', markers.length);
  console.log('Map markers data:', markers);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk"
  });

  const liveLocationIcon = isLoaded ? {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeWeight: 3,
    strokeColor: "white",
  } : {};

  const mapRef = useRef(null);
  const [active, setActive] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleMapClick = useCallback((event) => {
    if (onLocationSelect && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  const mapCenter = selectedLocation && selectedLocation.latitude && selectedLocation.longitude 
    ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
    : liveLocation || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      let added = false;
      if (Array.isArray(markers) && markers.length > 0) {
        markers.forEach(m => {
          if (m && typeof m.lat === 'number' && typeof m.lng === 'number') {
            bounds.extend({ lat: m.lat, lng: m.lng });
            added = true;
          }
        });
      }
      if (liveLocation && typeof liveLocation.lat === 'number' && typeof liveLocation.lng === 'number') {
        bounds.extend({ lat: liveLocation.lat, lng: liveLocation.lng });
        added = true;
      }
      if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
        bounds.extend({ lat: selectedLocation.latitude, lng: selectedLocation.longitude });
        added = true;
      }

      if (added) {
        const padding = 0.01;
        bounds.extend({ lat: bounds.getNorthEast().lat() + padding, lng: bounds.getNorthEast().lng() + padding });
        bounds.extend({ lat: bounds.getSouthWest().lat() - padding, lng: bounds.getSouthWest().lng() - padding });
        
        mapRef.current.fitBounds(bounds);
        
        const listener = window.google.maps.event.addListener(mapRef.current, 'bounds_changed', () => {
          if (mapRef.current.getZoom() > 16) {
            mapRef.current.setZoom(16);
          }
          window.google.maps.event.removeListener(listener);
        });
      } else {
        mapRef.current.setCenter(mapCenter);
        mapRef.current.setZoom(13);
      }
    } catch (e) {
      // ignore errors during bounds calculation
    }
  }, [isLoaded, markers, liveLocation, selectedLocation, mapCenter]);

  if (loadError) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center border-2 border-red-200">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-2">Map Loading Error</h3>
          <p className="text-sm text-red-700">Unable to load Google Maps. Please check your connection.</p>
        </div>
      </div>
    );
  }


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

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={13}
        onLoad={onLoad}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        {/* Draw the route line */}
        {path.length > 0 && (
          <Polyline
            path={path}
            options={{
              strokeColor: '#FF6B35',
              strokeOpacity: 0.9,
              strokeWeight: 5,
              icons: [{
                icon: {
                  path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#FF6B35'
                },
                offset: '100%',
                repeat: '100px'
              }]
            }}
          />
        )}
        
        {/* Draw markers */}
        {(() => {
          const sortedMarkers = [...markers].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
          return sortedMarkers.map((marker, index) => {
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
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 22,
                    fillColor: "#FF6B35",
                    fillOpacity: 1,
                    strokeWeight: 4,
                    strokeColor: "white",
                  }}
                  onClick={() => setActive({ ...marker, isHighestCapacity: true })}
                  animation={window.google.maps.Animation.BOUNCE}
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
                onClick={() => setActive(marker)}
              />
            );
          });
        })()}

        {/* Live location marker */}
        {liveLocation && (
          <Marker 
            position={liveLocation}
            icon={liveLocationIcon}
            title="Your Current Location"
            onClick={() => setActive({ ...liveLocation, address: 'You are here', type: 'live' })}
          />
        )}

        {/* Selected location marker */}
        {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
          <Marker 
            position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#FF6B6B",
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: "white",
            }}
            title="Selected Location"
            onClick={() => setActive({ 
              lat: selectedLocation.latitude, 
              lng: selectedLocation.longitude, 
              address: selectedLocation.address || 'Selected Location', 
              type: 'selected' 
            })}
          />
        )}

        {/* Enhanced InfoWindow */}
        {active && (
          <InfoWindow 
            position={{ lat: active.lat, lng: active.lng }} 
            onCloseClick={() => setActive(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -10)
            }}
          >
            <div className="p-2" style={{ maxWidth: 260 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {active.isHighestCapacity && (
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
                  {active.type === 'waste_account' ? '🗑️ Waste Account' : 
                   active.type === 'special' ? '⭐ Special Collection' : 
                   active.type === 'live' ? '📍 Current Location' : 
                   active.type === 'selected' ? '📌 Selected Location' : 
                   '📦 Collection Point'}
                </h3>
                <p className="text-sm text-gray-600">{active.address || 'No address available'}</p>
              </div>

              {active.pointId && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-xs text-gray-600">ID: <span className="font-mono font-semibold">{String(active.pointId)}</span></span>
                </div>
              )}

              {active.capacity !== undefined && active.capacity !== null && (
                <div className={`flex items-center justify-between p-3 rounded-lg ${active.isHighestCapacity ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-5 h-5 ${active.isHighestCapacity ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className={`text-sm font-semibold ${active.isHighestCapacity ? 'text-orange-800' : 'text-green-800'}`}>
                      Capacity
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${active.isHighestCapacity ? 'text-orange-600' : 'text-green-600'}`}>
                    {active.capacity.toFixed(1)}%
                  </span>
                </div>
              )}

              {active.isHighestCapacity && (
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
      </GoogleMap>
    </div>
  );
};

export default React.memo(Map);