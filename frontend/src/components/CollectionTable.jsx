import React from 'react';
import { getStatusColor, getStatusIcon, getWasteTypeIcon, formatDate } from '../utils/collectionUtils';

/**
 * Component responsible for displaying collections in table view
 * Single Responsibility: Table display of collections
 */
const CollectionTable = ({ collections, onCollectionSelect }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-green-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Collection Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Waste Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Collector
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {collections.map((collection, index) => (
              <tr
                key={collection.id || index}
                onClick={() => onCollectionSelect(collection)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-lg">
                      {getWasteTypeIcon(collection.wasteType)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{collection.accountHolder || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">ID: {collection.accountId || 'N/A'}</div>
                      {collection.address && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          📍 {collection.address}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(collection.status)}`}>
                    {getStatusIcon(collection.status)}
                    {collection.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg">
                    {getWasteTypeIcon(collection.wasteType)} {collection.wasteType || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg">
                    ⚖️ {collection.weight || 0} kg
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {collection.collectorId || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(collection.collectionTimestamp || collection.createdAt)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollectionTable;
