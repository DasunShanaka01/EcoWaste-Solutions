import { useState, useMemo } from 'react';

/**
 * Custom hook for managing collection filters and sorting
 * Single Responsibility: Filter and sort logic for collections
 */
export const useCollectionFilters = (collections) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');

  const filteredCollections = useMemo(() => {
    return collections
      .filter(collection => {
        if (filterStatus === 'all') return true;
        return collection.status?.toLowerCase() === filterStatus.toLowerCase();
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.collectionTimestamp || b.createdAt) - new Date(a.collectionTimestamp || a.createdAt);
          case 'status':
            return (a.status || '').localeCompare(b.status || '');
          case 'weight':
            return (b.weight || 0) - (a.weight || 0);
          default:
            return 0;
        }
      });
  }, [collections, filterStatus, sortBy]);

  return {
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    filteredCollections
  };
};
