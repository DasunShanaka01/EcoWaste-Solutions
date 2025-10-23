import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QRScanner() {
  const navigate = useNavigate();
  const [qrData, setQrData] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    if (!qrData.trim()) {
      alert('Please enter QR code data');
      return;
    }

    setScanning(true);
    try {
      const response = await fetch('http://localhost:8081/api/special-collection/scan-qr', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCodeData: qrData }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setQrData(''); // Clear the input
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
      setResult({
        success: false,
        error: 'Failed to scan QR code. Please try again.'
      });
    } finally {
      setScanning(false);
    }
  };

  const resetResult = () => {
    setResult(null);
    setQrData('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                QR Code Scanner
              </h1>
              <p className="text-gray-600 text-lg">Scan collection QR codes to mark as completed</p>
            </div>
            <button 
              onClick={() => navigate('/collector/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Scanner Interface */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="space-y-6">
            {/* QR Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Data
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="Paste QR code data here or scan with camera..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  disabled={scanning}
                />
                <button
                  onClick={handleScan}
                  disabled={scanning || !qrData.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {scanning ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Scanning...
                    </div>
                  ) : (
                    '🔍 Scan QR Code'
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ask the customer to show their collection QR code</li>
                <li>• Use a QR scanner app to scan the code</li>
                <li>• Paste the scanned data in the input field above</li>
                <li>• Click "Scan QR Code" to mark the collection as completed</li>
              </ul>
            </div>

            {/* Result Display */}
            {result && (
              <div className={`rounded-xl p-6 border-2 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {result.success ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? 'Collection Completed!' : 'Scan Failed'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.success ? result.message : result.error}
                    </p>
                    {result.success && result.collectionId && (
                      <div className="mt-3 text-sm text-green-600">
                        <p><strong>Collection ID:</strong> {result.collectionId}</p>
                        <p><strong>Status:</strong> {result.status}</p>
                        {result.collectedAt && (
                          <p><strong>Completed At:</strong> {new Date(result.collectedAt).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={resetResult}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    Scan Another QR Code
                  </button>
                </div>
              </div>
            )}

            {/* Sample QR Data for Testing */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-medium text-yellow-800 mb-2">For Testing:</h3>
              <p className="text-sm text-yellow-700 mb-2">
                You can test with this sample QR data (replace with actual collection ID and user ID):
              </p>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded">
                EWS_COLLECTION:68f66d9e6b03323ae9866e67:68ee7331c0453070a16ecdd4
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

