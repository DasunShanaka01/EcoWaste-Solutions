import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 6.9271, // Centered on Colombo, Sri Lanka
  lng: 79.8612
};

const Map = ({ markers = [], path = [], liveLocation = null }) => {
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

  // The map should center on the live location if available
  const mapCenter = liveLocation || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter);

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={15} // Zoom in closer to see the live location clearly
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
      {markers.map((marker, index) => (
        <Marker
          key={marker.pointId || index}
          position={{ lat: marker.lat, lng: marker.lng }}
          label={String(index + 1)} // Label markers as 1, 2, 3...
        />
      ))}

      {/* Draw the live location marker if it exists */}
      {liveLocation && (
        <Marker 
          position={liveLocation}
          icon={liveLocationIcon}
          title="Your Current Location"
        />
      )}
    </GoogleMap>
  ) : <p>Loading map...</p>;
};

export default React.memo(Map);