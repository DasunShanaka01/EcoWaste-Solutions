import React from 'react';

const QRCodeDisplay = ({ qrCodeBase64, wasteId, userName, category, weight, submissionMethod, status, paybackAmount }) => {
  // Helper function to safely render values (convert objects to strings)
  const safeRender = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  if (!qrCodeBase64) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>QR Code not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Waste Submission QR Code</h3>
        <p className="text-sm text-gray-600">Scan this QR code to view waste details</p>
      </div>
      
      <div className="flex justify-center mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <img 
            src={`data:image/png;base64,${qrCodeBase64}`} 
            alt="Waste Submission QR Code"
            className="w-48 h-48 mx-auto"
          />
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Waste Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">ID:</span>
            <span className="ml-2 font-medium">{safeRender(wasteId)}</span>
          </div>
          <div>
            <span className="text-gray-600">User:</span>
            <span className="ml-2 font-medium">{safeRender(userName)}</span>
          </div>
          <div>
            <span className="text-gray-600">Category:</span>
            <span className="ml-2 font-medium">{safeRender(category)}</span>
          </div>
          <div>
            <span className="text-gray-600">Weight:</span>
            <span className="ml-2 font-medium">{safeRender(weight)} kg</span>
          </div>
          <div>
            <span className="text-gray-600">Method:</span>
            <span className="ml-2 font-medium">{safeRender(submissionMethod)}</span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className="ml-2 font-medium">{safeRender(status)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Payback:</span>
            <span className="ml-2 font-medium text-green-600">LKR {paybackAmount ? safeRender(paybackAmount) : '0.00'}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${qrCodeBase64}`;
            link.download = `waste-qr-${wasteId}.png`;
            link.click();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Download QR Code
        </button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
