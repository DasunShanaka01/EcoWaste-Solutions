import React from 'react';
import { getStatusColor, getStatusIcon, getWasteTypeIcon, formatDate } from '../utils/collectionUtils';

/**
 * Component responsible for displaying collections in grid view
 * Single Responsibility: Grid display of collections
 */
const CollectionGrid = ({ collections, onCollectionSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <div
          key={collection.id}
          onClick={() => onCollectionSelect(collection)}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-300 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                {getWasteTypeIcon(collection.wasteType)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{collection.accountHolder || 'Unknown'}</h3>
                <p className="text-xs text-gray-500">ID: {collection.accountId || 'N/A'}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(collection.status)}`}>
              {getStatusIcon(collection.status)}
              {collection.status || 'Unknown'}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600 flex-1">{collection.address || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">{formatDate(collection.collectionTimestamp || collection.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-blue-50 rounded-lg">
                <span className="text-sm font-semibold text-blue-700">{collection.weight || 0} kg</span>
              </div>
              <div className="px-3 py-1 bg-purple-50 rounded-lg">
                <span className="text-xs font-medium text-purple-700">{collection.wasteType || 'N/A'}</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectionGrid;
