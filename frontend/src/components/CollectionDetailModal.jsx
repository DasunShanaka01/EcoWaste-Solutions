import React from 'react';
import { getStatusColor, getStatusIcon, getWasteTypeIcon, formatDate } from '../utils/collectionUtils';

/**
 * Component responsible for displaying collection details in a modal
 * Single Responsibility: Modal display of collection details
 */
const CollectionDetailModal = ({ collection, onClose }) => {
  if (!collection) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-3xl shadow-lg">
                {getWasteTypeIcon(collection.wasteType)}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{collection.accountHolder || 'Unknown'}</h2>
                <p className="text-green-100">Account ID: {collection.accountId || 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-full border-2 ${getStatusColor(collection.status)}`}>
              {getStatusIcon(collection.status)}
              {(collection.status || 'Unknown').toUpperCase()}
            </span>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-xs font-medium text-blue-700 uppercase">Weight</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{collection.weight || 0} kg</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-xs font-medium text-purple-700 uppercase">Waste Type</span>
              </div>
              <p className="text-lg font-bold text-purple-900">{collection.wasteType || 'N/A'}</p>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase mb-1">Collection Address</p>
                <p className="text-sm font-semibold text-gray-900">{collection.address || 'N/A'}</p>
              </div>
            </div>
            {collection.location && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-xs text-gray-600 font-mono">
                  GPS: {collection.location.lat?.toFixed(6) || 'N/A'}, {collection.location.lng?.toFixed(6) || 'N/A'}
                </span>
              </div>
            )}
          </div>

          {/* Collection Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase">Collection Details</h3>
            
            <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tag ID</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{collection.tagId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Collector ID</p>
                  <p className="text-sm font-semibold text-gray-900">{collection.collectorId || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Collection Timestamp</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(collection.collectionTimestamp || collection.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl">
              View on Map
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailModal;
