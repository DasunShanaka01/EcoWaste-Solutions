import { useState, useEffect } from 'react';

/**
 * Custom hook for managing waste collection data and state
 * Single Responsibility: Data fetching and state management for waste collection
 */
export const useWasteCollection = () => {
  const [markers, setMarkers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    remaining: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWasteLocations = async () => {
    try {
      setLoading(true);
      // First, auto-randomize capacity for waste accounts
      await autoRandomizeCapacity(0.5); // Randomize 50% of accounts
      
      // Then fetch waste accounts
      console.log('Fetching waste accounts from API...');
      const res = await fetch('http://localhost:8081/api/auth/waste-accounts', { credentials: 'include' });
      console.log('API response status:', res.status);
      
      if (!res.ok) {
        console.error('Failed fetching waste accounts', res.status, res.statusText);
        const errorText = await res.text();
        console.error('Error response:', errorText);
        setError('Failed to load waste account locations');
        return;
      }
      
      const data = await res.json();
      console.log('Raw API response:', data);

      const wasteAccountsList = Array.isArray(data) ? data.filter(account => account.accountId != null) : [];
      console.log('Processed waste accounts list:', wasteAccountsList);

      const accountMarkers = wasteAccountsList.map((account, idx) => {
        const loc = account.location || null;
        const latVal = loc && (loc.latitude ?? loc.lat);
        const lngVal = loc && (loc.longitude ?? loc.lng);
        if (latVal != null && lngVal != null) {
          return {
            lat: Number(latVal),
            lng: Number(lngVal),
            address: loc.address || '',
            pointId: account.accountId || `account-${idx}`,
            type: 'waste_account',
            status: 'active',
            capacity: account.capacity || 0.0
          };
        }
        return null;
      }).filter(Boolean);

      console.log('Waste accounts data:', wasteAccountsList);
      console.log('Account markers:', accountMarkers);

      // compute stats from waste accounts
      const totalStops = accountMarkers.length;
      const completed = 0; // No completed status for waste accounts
      const remaining = totalStops;
      setStats({ total: totalStops, completed, remaining });

      setMarkers(accountMarkers);
    } catch (e) {
      console.error('Error loading waste account locations', e);
      setError('Failed to load waste account locations');
    } finally {
      setLoading(false);
    }
  };

  const autoRandomizeCapacity = async (percentage = 0.5) => {
    try {
      const res = await fetch(`http://localhost:8081/api/auth/waste-accounts/randomize-capacity?percentage=${percentage}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        console.warn('Failed to auto-randomize capacity:', res.status, res.statusText);
        return;
      }
      
      console.log('Capacity auto-randomized successfully');
    } catch (e) {
      console.warn('Error auto-randomizing capacity:', e);
    }
  };

  const updateStats = (newStats) => {
    setStats(newStats);
  };

  const removeMarker = (pointId) => {
    setMarkers(prev => Array.isArray(prev) ? prev.filter(m => String(m.pointId) !== String(pointId)) : prev);
  };

  useEffect(() => {
    fetchWasteLocations();
  }, []);

  return {
    markers,
    stats,
    loading,
    error,
    updateStats,
    removeMarker,
    refetch: fetchWasteLocations
  };
};
