import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 6.9271, // Centered on Colombo, Sri Lanka
  lng: 79.8612
};

const Map = ({ markers = [], path = [], liveLocation = null, onLocationSelect = null, selectedLocation = null }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk" // <-- PASTE YOUR API KEY HERE
  });

  // Define the icon inside the component to ensure `window.google` is loaded
  const liveLocationIcon = isLoaded ? {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: "#4285F4", // Google Blue
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "white",
  } : {};

  // map ref so we can call fitBounds when markers update
  const mapRef = useRef(null);
  const [active, setActive] = useState(null);

  // Handle map click for location selection
  const handleMapClick = useCallback((event) => {
    if (onLocationSelect && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  // The map should center on the selected location, live location, or markers
  const mapCenter = selectedLocation && selectedLocation.latitude && selectedLocation.longitude 
    ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
    : liveLocation || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Fit map bounds to markers and live location when they change
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
        // Add padding to bounds to prevent excessive zooming
        const padding = 0.01; // degrees
        bounds.extend({ lat: bounds.getNorthEast().lat() + padding, lng: bounds.getNorthEast().lng() + padding });
        bounds.extend({ lat: bounds.getSouthWest().lat() - padding, lng: bounds.getSouthWest().lng() - padding });
        
        mapRef.current.fitBounds(bounds);
        
        // Set a maximum zoom level to prevent excessive zooming
        const listener = window.google.maps.event.addListener(mapRef.current, 'bounds_changed', () => {
          if (mapRef.current.getZoom() > 16) {
            mapRef.current.setZoom(16);
          }
          window.google.maps.event.removeListener(listener);
        });
      } else {
        // fallback center
        mapRef.current.setCenter(mapCenter);
        mapRef.current.setZoom(13);
      }
    } catch (e) {
      // ignore errors during bounds calculation
      // console.warn('Could not fit bounds', e);
    }
  }, [isLoaded, markers, liveLocation, selectedLocation, mapCenter]);

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={13} // initial zoom; will be adjusted by fitBounds if markers exist
      onLoad={onLoad}
      onClick={handleMapClick}
      options={{
        disableDefaultUI: true, // Optional: clean up the map UI
        zoomControl: true,
      }}
    >
      {/* Draw the route line */}
      {path.length > 0 && (
        <Polyline
          path={path}
          options={{
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      )}
      
      {/* Draw a marker for each collection point */}
      {markers.map((marker, index) => {
        const isWasteAccount = marker.type === 'waste_account';
        const isSpecial = marker.type === 'special';
        // Determine color by type: waste_account -> blue, special -> purple, completed -> green, pending/other -> red
        const status = marker.status ? String(marker.status).toLowerCase() : null;
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
            label={String(index + 1)}
            icon={{ url: iconUrl }}
            onClick={() => setActive(marker)}
          />
        );
      })}

      {/* Draw the live location marker if it exists */}
      {liveLocation && (
        <Marker 
          position={liveLocation}
          icon={liveLocationIcon}
          title="Your Current Location"
          onClick={() => setActive({ ...liveLocation, address: 'You are here', type: 'live' })}
        />
      )}

      {/* Draw the selected location marker if it exists */}
      {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
        <Marker 
          position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#FF6B6B", // Red color for selected location
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

      {/* InfoWindow for active marker */}
      {active && (
        <InfoWindow position={{ lat: active.lat, lng: active.lng }} onCloseClick={() => setActive(null)}>
          <div style={{ maxWidth: 220 }}>
            <div style={{ fontWeight: 600 }}>
              {active.type === 'waste_account' ? 'Waste Account' : 
               active.type === 'special' ? 'Special Collection' : 
               active.type === 'live' ? 'Current Location' : 
               active.type === 'selected' ? 'Selected Location' : 'Collection Point'}
            </div>
            <div style={{ fontSize: 12, color: '#444', marginTop: 6 }}>{active.address || ''}</div>
            {active.pointId && <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>ID: {String(active.pointId)}</div>}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : <p>Loading map...</p>;
};

export default React.memo(Map);