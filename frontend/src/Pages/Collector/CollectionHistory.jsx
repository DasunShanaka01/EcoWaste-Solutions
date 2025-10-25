import React, { useState } from 'react';
import { useCollectionHistory } from '../../hooks/useCollectionHistory';
import { useCollectionFilters } from '../../hooks/useCollectionFilters';
import CollectionStats from '../../components/CollectionStats';
import CollectionFilters from '../../components/CollectionFilters';
import CollectionGrid from '../../components/CollectionGrid';
import CollectionTable from '../../components/CollectionTable';
import CollectionDetailModal from '../../components/CollectionDetailModal';

/**
 * Main CollectionHistory component - now follows Single Responsibility Principle
 * Only responsible for orchestrating child components and managing selected collection state
 */
const CollectionHistory = () => {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const { collections, loading, error, refetch } = useCollectionHistory();
  const { 
    filterStatus, 
    setFilterStatus, 
    sortBy, 
    setSortBy, 
    viewMode, 
    setViewMode, 
    filteredCollections 
  } = useCollectionFilters(collections);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-green-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Loading collection history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Collection History</h1>
              <p className="text-gray-600">Track and manage all waste collections</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <CollectionStats collections={collections} />

        {/* Filters and View Toggle */}
        <CollectionFilters
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredCount={filteredCollections.length}
          totalCount={collections.length}
        />

        {/* Collections Display */}
        {filteredCollections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Collections Found</h3>
            <p className="text-gray-600">No collections match your current filters. Try adjusting your search criteria.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <CollectionGrid 
            collections={filteredCollections} 
            onCollectionSelect={setSelectedCollection} 
          />
        ) : (
          <CollectionTable 
            collections={filteredCollections} 
            onCollectionSelect={setSelectedCollection} 
          />
        )}

        {/* Detail Modal */}
        <CollectionDetailModal 
          collection={selectedCollection} 
          onClose={() => setSelectedCollection(null)} 
        />
      </div>
    </div>
  );
};

export default CollectionHistory;