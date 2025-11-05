import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { UploadHistory } from '../components/UploadHistory';
import { useAppContext } from '../context/AppContext';
import { FileText, LogOut, AlertCircle, UserCircle, ExternalLink } from 'lucide-react';

export const Upload = () => {
  const navigate = useNavigate();
  const { setUploadedFile, isAuthenticated, isXeroConnected, loginWithXero, logout, setWebhookError, webhookError } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('xero') === 'connected') {
      loginWithXero();
      window.history.replaceState({}, '', '/upload');
      return;
    }

    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loginWithXero, navigate]);

  useEffect(() => {
    setWebhookError(false);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileSelect = (selectedFile: File) => {
    setIsUploading(true);
    setUploadedFile(selectedFile);
  };

  const handleUploadSuccess = () => {
    navigate('/progress');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-12 h-12 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">SmartInvoice Dashboard</h1>
                <div className="flex items-center gap-2 mt-2">
                  {isXeroConnected ? (
                    <>
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Connected with Xero</span>
                    </>
                  ) : (
                    <>
                      <UserCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">Connected as Guest</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              Upload your invoice or purchase PDF and let AI extract the data for you
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {webhookError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Webhook Connection Error</p>
              <p className="text-sm text-red-700 mt-1">
                Unable to connect to the webhook. Please check if the webhook URL is correct and the service is running.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 relative">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload New Document</h2>
          <FileUpload onFileSelect={handleFileSelect} onUploadSuccess={handleUploadSuccess} />
          {isUploading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Processing invoice...</p>
                  <p className="text-xs text-blue-700 mt-1">
                    This may take a few minutes while our AI analyzes your document
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <UploadHistory />
      </div>
    </div>
  );
};
