import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Download, FileText, ExternalLink } from 'lucide-react';
import { WEBHOOKS } from '../config/webhooks';
import { useAppContext } from '../context/AppContext';

interface HistoryItem {
  review_id: string;
  status: string;
  created_at: string;
  final: any;
  file_name: string;
}

export const UploadHistory = () => {
  const { isXeroConnected } = useAppContext();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingToXero, setSendingToXero] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();

    const interval = setInterval(() => {
      fetchHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('review_id, status, created_at, final, file_name')
        .order('created_at', { ascending: false })
        .limit(7);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHistory = () => {
    fetchHistory();
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sendToXero = async (item: HistoryItem) => {
    setSendingToXero(item.review_id);
    try {
      // Send to webhook with route=xero
      try {
        await fetch(WEBHOOKS.choice.receiveChoice, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'xero',
            review_id: item.review_id,
          }),
        });
      } catch (webhookError) {
        console.error('Error sending to webhook:', webhookError);
      }

      // Send to Xero via edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-to-xero`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review_id: item.review_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Xero API error details:', error);
        const errorMessage = error.details || error.error || 'Failed to send to Xero';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      alert('Successfully sent invoice to Xero!');
      console.log('Xero result:', result);
    } catch (error) {
      console.error('Error sending to Xero:', error);
      alert(`Failed to send to Xero: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingToXero(null);
    }
  };

  const downloadAsXero = async (item: HistoryItem) => {
    try {
      await fetch(WEBHOOKS.choice.receiveChoice, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'xero',
          review_id: item.review_id,
        }),
      });
    } catch (error) {
      console.error('Error sending choice to webhook:', error);
    }

    const xeroData = item.final || {};
    const blob = new Blob([JSON.stringify(xeroData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.review_id}-xero.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = async (item: HistoryItem) => {
    try {
      const response = await fetch(WEBHOOKS.choice.receiveChoice, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'csv',
          review_id: item.review_id,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.review_id}-data.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error sending choice to webhook:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload History</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Upload History</h2>
        </div>
        <button
          onClick={refreshHistory}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No upload history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.review_id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {item.file_name || item.review_id}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isXeroConnected ? (
                    <button
                      onClick={() => sendToXero(item)}
                      disabled={sendingToXero === item.review_id}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send to Xero"
                    >
                      {sendingToXero === item.review_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Send to Xero
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => downloadAsXero(item)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Download as Xero JSON"
                    >
                      <Download className="w-4 h-4" />
                      Xero
                    </button>
                  )}
                  <button
                    onClick={() => downloadAsCSV(item)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    title="Download as CSV"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
