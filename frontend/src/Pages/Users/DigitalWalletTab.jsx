import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DigitalWalletTab({ userId, digitalWallet, digitalWalletLoading, fetchDigitalWallet }) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Digital Wallet</h2>
        <button
          onClick={() => fetchDigitalWallet(userId)}
          disabled={digitalWalletLoading}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${digitalWalletLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {digitalWalletLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading digital wallet...</span>
        </div>
      ) : digitalWallet ? (
        <div className="space-y-6">
          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
                <div className="text-4xl font-bold mb-2">{digitalWallet.points || 0}</div>
                <p className="text-purple-100">Points Available</p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Wallet Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet ID:</span>
                  <span className="font-medium">{digitalWallet.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {digitalWallet.createdAt ? new Date(digitalWallet.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {digitalWallet.updatedAt ? new Date(digitalWallet.updatedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Submit recyclable waste with Digital Wallet payback method</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>1 LKR = 1 Point (automatic conversion)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Points are added when waste is collected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          {digitalWallet.transactions && digitalWallet.transactions.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900">Recent Transactions</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {digitalWallet.transactions.slice(0, 10).map((transaction, index) => (
                  <div key={index} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'EARN' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <svg className={`w-4 h-4 ${
                          transaction.type === 'EARN' ? 'text-green-600' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {transaction.type === 'EARN' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.type === 'EARN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'EARN' ? '+' : '-'}{Math.abs(transaction.amount)} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 mb-4">Start earning points by submitting recyclable waste!</p>
              <button
                onClick={() => navigate("/waste-form")}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200"
              >
                Submit Waste
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Digital Wallet</h3>
          <p className="text-gray-600 mb-4">There was an error loading your digital wallet information.</p>
          <button
            onClick={() => fetchDigitalWallet(userId)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
