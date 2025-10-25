import React, { useState } from 'react';

/**
 * Component responsible for QR code scanning interface
 * Single Responsibility: QR scanning UI and interactions
 */
const QRScanner = ({ 
  scanning, 
  scanResult, 
  showError, 
  showManualEntry, 
  videoRef, 
  onScan, 
  onManualEntry, 
  onVerifyManual 
}) => {
  const [manualTagId, setManualTagId] = useState('');

  // Reset manual entry when component resets
  React.useEffect(() => {
    if (!showManualEntry) {
      setManualTagId('');
    }
  }, [showManualEntry]);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Scan Waste Bin Tag</h2>
      <p className="text-gray-600 mb-8">Position the scanner near the waste bin tag to read data</p>

      {!scanResult && !showError && !showManualEntry && (
        <div className="max-w-md mx-auto">
          <div className="bg-gray-50 rounded-lg p-12 text-center mb-6">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="text-gray-600">Ready to scan waste bin tag</p>
            <p className="text-xs text-gray-500 mt-2">
              QR codes should contain waste account IDs (e.g., WA123456789ABC)
            </p>
          </div>

          <div className="mb-4">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-64 bg-black rounded" />
            {scanning && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Scanning for QR codes...
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={onScan}
              disabled={scanning}
              className={`w-full max-w-xs py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                scanning
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {scanning ? 'Scanning Bin Tag...' : 'Activate Scanner'}
            </button>
          </div>
        </div>
      )}

      {showError && (
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-red-900">Tag Read Failure</span>
            </div>
            <p className="text-sm text-red-700 mb-4">
              Unable to read tag. The tag may be damaged or missing. You can enter the information manually or take photos for investigation.
            </p>
          </div>

          <button
            onClick={onManualEntry}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors mb-3"
          >
            Enter Manual Data
          </button>

          <button
            onClick={onScan}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Scanning Again
          </button>
        </div>
      )}

      {showManualEntry && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Manual entry mode. Please enter the waste account ID to verify the account and continue with collection.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Waste Account ID *</label>
            <input
              type="text"
              name="tagId"
              value={manualTagId}
              onChange={(e) => setManualTagId(e.target.value)}
              placeholder="Enter waste account ID (e.g., WA123456789ABC)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => onVerifyManual(manualTagId)}
            disabled={!manualTagId.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Verify Waste Account ID
          </button>
        </div>
      )}

      {scanResult?.success && (
        <div className="max-w-md mx-auto">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-semibold text-green-900 text-lg">Bin Tag Scanned Successfully</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-green-200">
                <span className="text-green-700">Account ID:</span>
                <span className="font-mono font-semibold text-green-900">{scanResult.data?.accountId || scanResult.tagId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-green-200">
                <span className="text-green-700">Account Holder:</span>
                <span className="font-semibold text-green-900">{scanResult.data?.userName || scanResult.accountHolder}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-green-200">
                <span className="text-green-700">Capacity:</span>
                <span className="font-semibold text-green-900">{scanResult.data?.capacity ? `${scanResult.data.capacity.toFixed(1)}%` : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-green-700">Location:</span>
                <span className="font-semibold text-green-900">{scanResult.data?.address || scanResult.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2 text-sm text-gray-600 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
