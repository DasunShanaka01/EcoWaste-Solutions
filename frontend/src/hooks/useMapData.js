import { useMemo } from 'react';

/**
 * Custom hook for processing map data
 * Single Responsibility: Map data processing and transformation
 */
export const useMapData = (markers, liveLocation, selectedLocation) => {
  const processedMarkers = useMemo(() => {
    if (!Array.isArray(markers)) return [];
    
    return [...markers].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
  }, [markers]);

  const mapCenter = useMemo(() => {
    return selectedLocation && selectedLocation.latitude && selectedLocation.longitude 
      ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
      : liveLocation || (processedMarkers.length > 0 ? { lat: processedMarkers[0].lat, lng: processedMarkers[0].lng } : { lat: 6.9271, lng: 79.8612 });
  }, [selectedLocation, liveLocation, processedMarkers]);

  const bounds = useMemo(() => {
    if (processedMarkers.length === 0 && !liveLocation && !selectedLocation) return null;
    
    return {
      markers: processedMarkers,
      liveLocation,
      selectedLocation
    };
  }, [processedMarkers, liveLocation, selectedLocation]);

  return {
    processedMarkers,
    mapCenter,
    bounds
  };
};
