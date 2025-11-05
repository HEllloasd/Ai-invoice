import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Loader2, ArrowRight, ExternalLink, UserCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, loginWithXero } = useAppContext();
  const [isConnectingXero, setIsConnectingXero] = useState(false);
  const [isConnectingGuest, setIsConnectingGuest] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/upload');
    }
  }, [isAuthenticated, navigate]);

  const handleXeroLogin = async () => {
    setIsConnectingXero(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const returnUrl = window.location.origin; // Get current origin (works in both dev and production)

      const response = await fetch(`${supabaseUrl}/functions/v1/xero-auth/connect?return_url=${encodeURIComponent(returnUrl)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Xero connection');
      }

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Xero login page
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      alert('Failed to connect to Xero. Please try again.');
      setIsConnectingXero(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsConnectingGuest(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    login();
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-lg">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to SmartInvoice
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered invoice processing that extracts data automatically
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6 mx-auto">
              <ExternalLink className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Login with Xero
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Connect your Xero account for automatic invoice sync and enhanced features
            </p>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Automatic invoice uploads to Xero
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Real-time data synchronization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Direct export to your accounting system
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                Seamless workflow integration
              </li>
            </ul>
            <button
              onClick={handleXeroLogin}
              disabled={isConnectingXero || isConnectingGuest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnectingXero ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting to Xero...
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  Connect with Xero
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl mb-6 mx-auto">
              <UserCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Continue as Guest
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Start using SmartInvoice without connecting to Xero
            </p>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                AI-powered data extraction
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Manual review and editing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Download extracted data as Excel
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Upload history tracking
              </li>
            </ul>
            <button
              onClick={handleGuestLogin}
              disabled={isConnectingXero || isConnectingGuest}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnectingGuest ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Continue as Guest
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
