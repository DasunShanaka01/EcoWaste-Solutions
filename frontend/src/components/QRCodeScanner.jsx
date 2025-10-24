import React, { useState } from 'react';

const QRCodeScanner = ({ onScanResult }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  
  // Helper function to safely render values (convert objects to strings)
  const safeRender = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const handleManualScan = async () => {
    if (!manualInput.trim()) {
      setError('Please enter QR code data');
      return;
    }

    try {
      setError('');
      const response = await fetch('http://localhost:8080/api/waste/scan-qr', {
  const response = await fetch('http://localhost:8081/api/waste/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: manualInput }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setScanResult(result);
        onScanResult && onScanResult(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to scan QR code');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real implementation, you would use a QR code scanning library
      // For now, we'll just show a message
      setError('File upload for QR scanning not implemented yet. Please use manual input.');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan QR Code</h3>
      
      {!isScanning ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual QR Code Data Input
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste QR code data here or scan with camera..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Upload QR Code Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleManualScan}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Scan QR Code
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Scanning QR code...</p>
          <button
            onClick={() => setIsScanning(false)}
            className="mt-4 text-blue-500 hover:text-blue-700"
          >
            Cancel
          </button>
        </div>
      )}
      
      {scanResult && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Scan Result</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-green-700">Waste ID:</span>
              <span className="ml-2 font-medium">{safeRender(scanResult.wasteId)}</span>
            </div>
            <div>
              <span className="text-green-700">User:</span>
              <span className="ml-2 font-medium">{safeRender(scanResult.userName)}</span>
            </div>
            <div>
              <span className="text-green-700">Category:</span>
              <span className="ml-2 font-medium">{safeRender(scanResult.category)}</span>
            </div>
            <div>
              <span className="text-green-700">Weight:</span>
              <span className="ml-2 font-medium">{safeRender(scanResult.weight)} kg</span>
            </div>
            <div>
              <span className="text-green-700">Method:</span>
              <span className="ml-2 font-medium">{safeRender(scanResult.submissionMethod)}</span>
            </div>
            <div>
              <span className="text-green-700">Status:</span>
              <span className="ml-2 font-medium">{safeRender(scanResult.status)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-green-700">Payback Amount:</span>
              <span className="ml-2 font-medium text-green-600">LKR {scanResult.paybackAmount ? safeRender(scanResult.paybackAmount) : '0.00'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
