import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, FileText, Edit3 } from 'lucide-react';
import { WEBHOOKS } from '../config/webhooks';

export const Review = () => {
  const navigate = useNavigate();
  const { uploadedFile, webhookResponse } = useAppContext();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [matchedData, setMatchedData] = useState<any>(null);
  const [ai1DiffData, setAi1DiffData] = useState<any>(null);
  const [ai2DiffData, setAi2DiffData] = useState<any>(null);
  const [selectedDiffs, setSelectedDiffs] = useState<{[key: string]: 'ai1' | 'ai2'}>({});

  const mockAgent1Data = {
    model: 'AI Agent 1',
    ERP: {
      Type: 'ACCREC' as const,
      Contact: { Name: 'Tech Solutions Inc' },
      Date: '2025-11-03',
      DueDate: '2025-12-03',
      LineItems: [
        {
          Description: 'Professional Services',
          Quantity: 10,
          UnitAmount: 150,
          AccountCode: '200',
        },
      ],
      Status: 'AUTHORISED',
    },
    CRM: {
      Name: 'Tech Solutions Inc',
      EmailAddress: 'contact@techsolutions.com',
    },
  };

  const mockAgent2Data = {
    model: 'AI Agent 2',
    ERP: {
      Type: 'ACCREC' as const,
      Contact: { Name: 'Tech Solutions Incorporated' },
      Date: '2025-11-03',
      DueDate: '2025-12-03',
      LineItems: [
        {
          Description: 'Professional Services',
          Quantity: 10,
          UnitAmount: 155,
          AccountCode: '200',
        },
      ],
      Status: 'AUTHORISED',
    },
    CRM: {
      Name: 'Tech Solutions Incorporated',
      EmailAddress: 'contact@techsolutions.com',
    },
  };

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  useEffect(() => {
    console.log('Webhook Response:', webhookResponse);
    console.log('Matched Data:', webhookResponse?.matched);
    console.log('Differences Data:', webhookResponse?.differences);
  }, [webhookResponse]);

  useEffect(() => {
    let matched, ai1Diff, ai2Diff;
    if (webhookResponse) {
      matched = webhookResponse.matched || {};
      ai1Diff = webhookResponse.ai_1_diff || {};
      ai2Diff = webhookResponse.ai_2_diff || {};
    } else {
      matched = {
        ERP: mockAgent1Data.ERP,
        CRM: mockAgent1Data.CRM
      };
      ai1Diff = {};
      ai2Diff = {};
    }
    setMatchedData(matched);
    setAi1DiffData(ai1Diff);
    setAi2DiffData(ai2Diff);

    const initialSelections: {[key: string]: 'ai1' | 'ai2'} = {};
    Object.keys(ai1Diff).forEach(key => {
      initialSelections[key] = 'ai1';
    });
    setSelectedDiffs(initialSelections);
  }, [webhookResponse]);


  const handleConfirm = async () => {
    navigate('/upload');

    if (webhookResponse?.review_id) {
      const finalData: any = { ...matchedData };

      Object.keys(selectedDiffs).forEach(key => {
        const selectedModel = selectedDiffs[key];
        if (selectedModel === 'ai1') {
          finalData[key] = ai1DiffData[key];
        } else if (selectedModel === 'ai2') {
          finalData[key] = ai2DiffData[key];
        }
      });

      const payload = {
        review_id: webhookResponse.review_id,
        data: finalData
      };

      console.log('Sending to webhook in background:', payload);

      fetch(WEBHOOKS.review.result, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then(response => {
        if (response.ok) {
          console.log('Webhook success');
        } else {
          console.warn('Webhook failed:', response.status);
        }
      }).catch(error => {
        console.warn('Error sending to webhook:', error);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Review & Edit</h1>
          </div>
          <p className="text-gray-600">
            Compare the results from both AI agents and edit the final values
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Original Document</h2>
            </div>
            {pdfUrl ? (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px]"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="border-2 border-gray-200 rounded-lg h-[600px] flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No document uploaded</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Extracted Data</h2>
              </div>
              {webhookResponse && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Status:</span>
                      <span className="ml-2 text-gray-900">{webhookResponse.status || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Review ID:</span>
                      <span className="ml-2 text-gray-900">{webhookResponse.review_id || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Output</h3>
                {matchedData && Object.keys(matchedData).length > 0 ? (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(matchedData, null, 2)}</pre>
                ) : (
                  <p className="text-sm text-gray-500 italic">No similar output found</p>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Different Output</h3>
                {ai1DiffData && ai2DiffData && (Object.keys(ai1DiffData).length > 0 || Object.keys(ai2DiffData).length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold text-gray-900">AI Model 1</h4>
                        {Object.keys(ai1DiffData).length > 0 && (
                          <button
                            onClick={() => {
                              const newSelections: {[key: string]: 'ai1' | 'ai2'} = {};
                              Object.keys(ai1DiffData).forEach(key => {
                                newSelections[key] = 'ai1';
                              });
                              setSelectedDiffs(newSelections);
                            }}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                          >
                            Select
                          </button>
                        )}
                      </div>
                      {Object.keys(ai1DiffData).length > 0 ? (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(ai1DiffData, null, 2)}</pre>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No different output found</p>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold text-gray-900">AI Model 2</h4>
                        {Object.keys(ai2DiffData).length > 0 && (
                          <button
                            onClick={() => {
                              const newSelections: {[key: string]: 'ai1' | 'ai2'} = {};
                              Object.keys(ai2DiffData).forEach(key => {
                                newSelections[key] = 'ai2';
                              });
                              setSelectedDiffs(newSelections);
                            }}
                            className="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
                          >
                            Select
                          </button>
                        )}
                      </div>
                      {Object.keys(ai2DiffData).length > 0 ? (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(ai2DiffData, null, 2)}</pre>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No different output found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No different output found</p>
                )}
                {Object.keys(selectedDiffs).length > 0 && (
                  <div className="mt-4 p-3 bg-white border border-gray-300 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Selected Model:</p>
                    <p className="text-sm text-gray-600">
                      {Object.keys(selectedDiffs).map(key => `${key}: ${selectedDiffs[key] === 'ai1' ? 'AI Model 1' : 'AI Model 2'}`).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={handleConfirm}>
                Confirm & Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
