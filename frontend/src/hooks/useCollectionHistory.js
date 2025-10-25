import { useState, useEffect } from 'react';

/**
 * Custom hook for managing collection history data
 * Single Responsibility: Data fetching and state management for collections
 */
export const useCollectionHistory = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCollectionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8081/api/collections', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collection history');
      }

      const data = await response.json();
      setCollections(data);
    } catch (err) {
      console.error('Error fetching collection history:', err);
      setError('Failed to load collection history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionHistory();
  }, []);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollectionHistory
  };
};
