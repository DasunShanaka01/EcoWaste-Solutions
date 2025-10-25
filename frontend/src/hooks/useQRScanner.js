import { useState, useRef } from 'react';

/**
 * Custom hook for managing QR code scanning functionality
 * Single Responsibility: QR code scanning logic and state management
 */
export const useQRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showError, setShowError] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const videoRef = useRef(null);
  const scanLoopRef = useRef(null);

  const processQR = async (qrData) => {
    try {
      console.log('Processing QR data:', qrData);
      
      // Validate QR data format (should be account ID like WA123456789ABC)
      if (!qrData || typeof qrData !== 'string') {
        console.error('Invalid QR data format:', qrData);
        setShowError(true);
        setScanning(false);
        return;
      }
      
      // Check if it looks like a waste account ID
      if (!qrData.startsWith('WA') || qrData.length < 10) {
        console.warn('QR data does not appear to be a waste account ID:', qrData);
        // Still try to process it in case it's valid
      }
      
      // send to backend to parse and get waste account details
      const res = await fetch('http://localhost:8081/api/auth/waste-accounts/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrData: qrData.trim() })
      });
      
      console.log('Backend response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Backend error:', res.status, errorText);
        setShowError(true);
        setScanning(false);
        return;
      }
      
      const json = await res.json();
      console.log('Backend response data:', json);
      
      setScanResult({ success: true, data: json });
      setScanning(false);
      return json;
    } catch (e) {
      console.error('Error processing QR', e);
      setShowError(true);
      setScanning(false);
      return null;
    }
  };

  const handleScan = () => {
    setScanning(true);
    setScanResult(null);
    setShowError(false);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Use BarcodeDetector if available in the browser
        const BarcodeDetectorClass = typeof window !== 'undefined' ? window.BarcodeDetector || null : null;
        if (BarcodeDetectorClass) {
          console.log('BarcodeDetector is available, starting QR detection...');
          const formats = ['qr_code'];
          const detector = new BarcodeDetectorClass({ formats });
          scanLoopRef.current = setInterval(async () => {
            try {
              if (!videoRef.current) return;
              const results = await detector.detect(videoRef.current);
              if (results && results.length > 0) {
                console.log('QR code detected:', results[0]);
                const q = results[0].rawValue || results[0].displayValue || results[0].raw_text || results[0].rawData;
                console.log('Extracted QR data:', q);
                stopCamera();
                await processQR(q);
              }
            } catch (err) {
              console.warn('QR detection error (continuing):', err);
            }
          }, 800);
        } else {
          console.warn('BarcodeDetector not available, falling back to manual entry');
          setTimeout(() => {
            setShowError(true);
            setScanning(false);
          }, 5000);
        }
      } catch (err) {
        console.warn('Camera unavailable', err);
        setShowError(true);
        setScanning(false);
      }
    };

    startCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (scanLoopRef.current) {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
  };

  const handleManualEntry = () => {
    setShowError(false);
    setShowManualEntry(true);
  };

  const resetScanner = () => {
    setScanning(false);
    setScanResult(null);
    setShowError(false);
    setShowManualEntry(false);
    stopCamera();
  };

  return {
    scanning,
    scanResult,
    setScanResult,
    showError,
    showManualEntry,
    videoRef,
    processQR,
    handleScan,
    handleManualEntry,
    resetScanner
  };
};
