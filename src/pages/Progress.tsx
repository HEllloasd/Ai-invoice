import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressLog } from '../components/ProgressLog';
import { Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Progress = () => {
  const navigate = useNavigate();
  const { webhookResponse, webhookError } = useAppContext();

  useEffect(() => {
    // Redirect on webhook error
    if (webhookError) {
      const timer = setTimeout(() => {
        navigate('/upload');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [webhookError, navigate]);

  useEffect(() => {
    // Redirect on webhook success
    if (webhookResponse) {
      const timer = setTimeout(() => {
        navigate('/review');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [webhookResponse, navigate]);

  const handleComplete = async () => {
    navigate('/review');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-10 h-10 text-blue-600 animate-pulse" />
            <h1 className="text-3xl font-bold text-gray-900">Processing Invoice</h1>
          </div>
          <p className="text-gray-600">
            AI agents are analyzing your invoice...
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ProgressLog onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
};
