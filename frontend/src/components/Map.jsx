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
    googleMapsApiKey: "AIzaSyAgb9LJDsv4RJLNBUFAotIB8v7acax8sAA" // <-- PASTE YOUR API KEY HERE
  });

  // Define the icon inside the component
  const liveLocationIcon = isLoaded ? {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "white",
  } : {};

  const mapCenter = liveLocation || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter);

  if (loadError) {
    return <div>Map cannot be loaded right now, sorry.</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
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
      
      {markers.map((marker, index) => (
        <Marker
          key={marker.pointId || index}
          position={{ lat: marker.lat, lng: marker.lng }}
          label={String(index + 1)}
        />
      ))}

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