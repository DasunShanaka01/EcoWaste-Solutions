import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import FallbackMap from './FallbackMap';
import MapLegend from './MapLegend';
import MapStats from './MapStats';
import MapMarkers from './MapMarkers';
import { useMapData } from '../hooks/useMapData';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
  overflow: 'hidden'
};

/**
 * Main Map component - now follows Single Responsibility Principle
 * Only responsible for orchestrating map rendering and managing map state
 */
const Map = ({ markers = [], path = [], liveLocation = null, onLocationSelect = null, selectedLocation = null }) => {
  console.log('Map component received markers:', markers.length);
  console.log('Map markers data:', markers);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk",
    libraries: ['places']
  });

  const mapRef = useRef(null);
  const [activeMarker, setActiveMarker] = useState(null);
  
  // Use custom hook for data processing
  const { processedMarkers, mapCenter, bounds } = useMapData(markers, liveLocation, selectedLocation);

  const handleMapClick = useCallback((event) => {
    if (onLocationSelect && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  const handleMarkerClick = useCallback((marker) => {
    setActiveMarker(marker);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setActiveMarker(null);
  }, []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    // setMapLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google || !bounds) return;
    try {
      const googleBounds = new window.google.maps.LatLngBounds();
      let added = false;
      
      if (Array.isArray(bounds.markers) && bounds.markers.length > 0) {
        bounds.markers.forEach(m => {
          if (m && typeof m.lat === 'number' && typeof m.lng === 'number') {
            googleBounds.extend({ lat: m.lat, lng: m.lng });
            added = true;
          }
        });
      }
      if (bounds.liveLocation && typeof bounds.liveLocation.lat === 'number' && typeof bounds.liveLocation.lng === 'number') {
        googleBounds.extend({ lat: bounds.liveLocation.lat, lng: bounds.liveLocation.lng });
        added = true;
      }
      if (bounds.selectedLocation && bounds.selectedLocation.latitude && bounds.selectedLocation.longitude) {
        googleBounds.extend({ lat: bounds.selectedLocation.latitude, lng: bounds.selectedLocation.longitude });
        added = true;
      }

      if (added) {
        const padding = 0.01;
        googleBounds.extend({ lat: googleBounds.getNorthEast().lat() + padding, lng: googleBounds.getNorthEast().lng() + padding });
        googleBounds.extend({ lat: googleBounds.getSouthWest().lat() - padding, lng: googleBounds.getSouthWest().lng() - padding });
        
        mapRef.current.fitBounds(googleBounds);
        
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
  }, [isLoaded, bounds, mapCenter]);

  if (loadError) {
    console.warn('Google Maps failed to load, using fallback map:', loadError);
    return (
      <FallbackMap 
        markers={markers}
        liveLocation={liveLocation}
        onLocationSelect={onLocationSelect}
        selectedLocation={selectedLocation}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center border-2 border-blue-200">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-blue-900 mb-2">Loading Map...</h3>
          <p className="text-sm text-blue-700">Please wait while we load Google Maps.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="relative">
      {/* Map Legend */}
      <MapLegend />

      {/* Map Stats */}
      <MapStats markers={processedMarkers} />

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
              icons: isLoaded && window.google ? [{
                icon: {
                  path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#FF6B35'
                },
                offset: '100%',
                repeat: '100px'
              }] : []
            }}
          />
        )}
        
        {/* Map Markers */}
        <MapMarkers
          markers={processedMarkers}
          liveLocation={liveLocation}
          selectedLocation={selectedLocation}
          activeMarker={activeMarker}
          onMarkerClick={handleMarkerClick}
          onInfoWindowClose={handleInfoWindowClose}
          isLoaded={isLoaded}
        />
      </GoogleMap>
    </div>
  );
};

export default React.memo(Map);