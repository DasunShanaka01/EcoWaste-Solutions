import React from 'react';

/**
 * Component responsible for collection filtering and view controls
 * Single Responsibility: Filter and view mode controls
 */
const CollectionFilters = ({ 
  filterStatus, 
  setFilterStatus, 
  sortBy, 
  setSortBy, 
  viewMode, 
  setViewMode, 
  filteredCount, 
  totalCount 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="collected">✓ Collected</option>
              <option value="complete">✓ Completed</option>
              <option value="pending">⏳ Pending</option>
              <option value="in_progress">⚡ In Progress</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <option value="date">📅 Date</option>
              <option value="status">🏷️ Status</option>
              <option value="weight">⚖️ Weight</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            {filteredCount} of {totalCount}
          </span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-all ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionFilters;
