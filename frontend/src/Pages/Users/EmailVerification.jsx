import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/auth";
import { useUser } from "./UserContext";

export default function EmailVerification() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) {
      navigate("/users/register/step1");
      return;
    }
    
    // Start countdown for resend button
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user?.email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (code.length !== 4) {
      setError("Please enter a 4-digit verification code");
      setIsLoading(false);
      return;
    }

    try {
      await api.verifyEmail({ email: user.email, code });
      // Update user context with verified status
      setUser({ ...user, emailVerified: true });
      navigate("/users/register/step2");
    } catch (err) {
      console.error("Verification error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Verification failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError("");

    try {
      await api.sendVerificationCode(user.email);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Resend code error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Failed to resend code";
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600 mb-2">
              We've sent a 4-digit verification code to
            </p>
            <p className="text-blue-600 font-medium mb-8">{user?.email}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                required
                maxLength="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none text-center text-2xl tracking-widest"
                placeholder="0000"
                value={code}
                onChange={handleCodeChange}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 4}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Didn't receive the code?{" "}
              <button
                onClick={handleResendCode}
                disabled={resendLoading || countdown > 0}
                className="font-medium text-blue-600 hover:text-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </button>
            </p>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate("/users/register/step1")}
                className="text-sm text-gray-500 hover:text-gray-700 transition duration-200"
              >
                ← Back to Step 1
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
