import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/auth";
import { useUser } from "./UserContext";
import Map from "../../components/Map";

export default function RegisterStep3() {
  const [location, setLocation] = useState({
    latitude: 0,
    longitude: 0,
    address: "",
    city: "",
    country: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationMethod, setLocationMethod] = useState("manual"); // "live" or "manual"
  const [wasteAccount, setWasteAccount] = useState(null);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) {
      navigate("/users/register/step1");
      return;
    }
  }, [user, navigate]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        // Try to get address from coordinates
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          setLocation(prev => ({
            ...prev,
            address: data.localityInfo?.administrative?.[0]?.name || "",
            city: data.city || data.locality || "",
            country: data.countryName || ""
          }));
        } catch (err) {
          console.error("Error fetching address:", err);
        }
        
        setIsLoading(false);
      },
      (error) => {
        setError("Unable to retrieve your location: " + error.message);
        setIsLoading(false);
      }
    );
  };

  const handleMapClick = (lat, lng) => {
    setLocation(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleCreateWasteAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      if (!location.latitude || !location.longitude) {
        setError("Please select a location on the map or use live location.");
        return;
      }

       // Location details are now optional, only coordinates are required

      const wasteAccountData = await api.registerStep3(user.id, location);
      setWasteAccount(wasteAccountData);
      
      // Update user context with waste account info
      setUser(prev => ({
        ...prev,
        wasteAccount: wasteAccountData
      }));
      
    } catch (err) {
      console.error("Waste account creation error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Failed to create waste account";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = () => {
    navigate("/");
  };

  const downloadQRCode = () => {
    if (wasteAccount?.qrCode) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${wasteAccount.qrCode}`;
      link.download = `waste-account-qr-${wasteAccount.accountId}.png`;
      link.click();
    }
  };

  if (wasteAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
              <p className="text-gray-600 mb-8">Your waste account has been created successfully</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Waste Account Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Account ID:</span>
                    <span className="ml-2 font-medium">{wasteAccount.accountId}</span>
                  </div>
                   <div>
                     <span className="text-gray-600">Location:</span>
                     <span className="ml-2 font-medium">
                       {wasteAccount.location.city && wasteAccount.location.country 
                         ? `${wasteAccount.location.city}, ${wasteAccount.location.country}`
                         : wasteAccount.location.address || 'Location selected on map'
                       }
                     </span>
                   </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Your QR Code</h3>
                <div className="bg-white p-4 rounded-lg shadow-sm border inline-block">
                  <img 
                    src={`data:image/png;base64,${wasteAccount.qrCode}`} 
                    alt="Waste Account QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <button
                  onClick={downloadQRCode}
                  className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Download QR Code
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={handleCompleteRegistration}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200"
              >
                Go to Home Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
              <span className="text-purple-600 text-xl font-bold">3</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Final Step!</h2>
            <p className="text-gray-600 mb-8">Step 3: Create your waste account and select your location</p>
          </div>
          
          <form onSubmit={handleCreateWasteAccount} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Location Selection</h3>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setLocationMethod("live")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    locationMethod === "live"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Use Live Location
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMethod("manual")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    locationMethod === "manual"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Select on Map
                </button>
              </div>

              {locationMethod === "live" && (
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Getting Location...
                    </div>
                  ) : (
                    "Get Current Location"
                  )}
                </button>
              )}

               {locationMethod === "manual" && (
                 <div className="border rounded-lg p-4">
                   <Map 
                     onLocationSelect={handleMapClick} 
                     selectedLocation={location}
                   />
                   <p className="text-sm text-gray-600 mt-2">
                     Click on the map to select your location
                     {location.latitude && location.longitude && (
                       <span className="text-green-600 font-medium ml-2">
                         ✓ Location selected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                       </span>
                     )}
                   </p>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                   Address <span className="text-gray-500 text-sm">(Optional)</span>
                 </label>
                 <input
                   id="address"
                   type="text"
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 outline-none"
                   placeholder="Enter your address"
                   value={location.address}
                   onChange={e => setLocation(prev => ({ ...prev, address: e.target.value }))}
                 />
               </div>
               
               <div>
                 <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                   City <span className="text-gray-500 text-sm">(Optional)</span>
                 </label>
                 <input
                   id="city"
                   type="text"
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 outline-none"
                   placeholder="Enter your city"
                   value={location.city}
                   onChange={e => setLocation(prev => ({ ...prev, city: e.target.value }))}
                 />
               </div>
               
               <div className="md:col-span-2">
                 <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                   Country <span className="text-gray-500 text-sm">(Optional)</span>
                 </label>
                 <input
                   id="country"
                   type="text"
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 outline-none"
                   placeholder="Enter your country"
                   value={location.country}
                   onChange={e => setLocation(prev => ({ ...prev, country: e.target.value }))}
                 />
               </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Waste Account...
                </div>
              ) : (
                "Create Waste Account"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/users/register/step2")}
              className="text-sm text-gray-500 hover:text-gray-700 transition duration-200"
            >
              ← Back to Step 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
