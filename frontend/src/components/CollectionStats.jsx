import React from 'react';
import { calculateStats } from '../utils/collectionUtils';

/**
 * Component responsible for displaying collection statistics
 * Single Responsibility: Display collection statistics
 */
const CollectionStats = ({ collections }) => {
  const stats = calculateStats(collections);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-3xl">✓</span>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
        <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
        <p className="text-xs text-green-600 mt-2">↑ Collections done</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-yellow-100 hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-3xl">⏳</span>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
        <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        <p className="text-xs text-yellow-600 mt-2">Awaiting collection</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-3xl">⚖️</span>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">Total Weight</p>
        <p className="text-3xl font-bold text-gray-900">
          {stats.totalWeight.toFixed(1)}
          <span className="text-lg text-gray-500 ml-1">kg</span>
        </p>
        <p className="text-xs text-blue-600 mt-2">Total collected</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-3xl">📍</span>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">Total Collections</p>
        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        <p className="text-xs text-purple-600 mt-2">All locations</p>
      </div>
    </div>
  );
};

export default CollectionStats;
