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
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<any>(null);
  const [matchedData, setMatchedData] = useState<any>(null);
  const [ai1DiffData, setAi1DiffData] = useState<any>(null);
  const [ai2DiffData, setAi2DiffData] = useState<any>(null);
  const [matchedInput, setMatchedInput] = useState<string>('');
  const [ai1DiffInput, setAi1DiffInput] = useState<string>('');
  const [ai2DiffInput, setAi2DiffInput] = useState<string>('');
  const [matchedError, setMatchedError] = useState<string>('');
  const [ai1DiffError, setAi1DiffError] = useState<string>('');
  const [ai2DiffError, setAi2DiffError] = useState<string>('');

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
    let initialData;
    let matched, ai1Diff, ai2Diff;
    if (webhookResponse) {
      initialData = {
        ERP: webhookResponse.matched?.ERP || webhookResponse.ai_1_diff?.ERP || mockAgent1Data.ERP,
        CRM: webhookResponse.matched?.CRM || webhookResponse.ai_1_diff?.CRM || mockAgent1Data.CRM
      };
      matched = webhookResponse.matched || {};
      ai1Diff = webhookResponse.ai_1_diff || {};
      ai2Diff = webhookResponse.ai_2_diff || {};
      setMatchedInput(JSON.stringify(matched, null, 2));
      setAi1DiffInput(JSON.stringify(ai1Diff, null, 2));
      setAi2DiffInput(JSON.stringify(ai2Diff, null, 2));
    } else {
      // Use mock data if no webhook response
      initialData = {
        ERP: mockAgent1Data.ERP,
        CRM: mockAgent1Data.CRM
      };
      matched = initialData;
      ai1Diff = {};
      ai2Diff = {};
      setMatchedInput(JSON.stringify(initialData, null, 2));
      setAi1DiffInput('{}');
      setAi2DiffInput('{}');
    }
    setEditableData(initialData);
    setMatchedData(matched);
    setAi1DiffData(ai1Diff);
    setAi2DiffData(ai2Diff);
  }, [webhookResponse]);


  const handleConfirm = async () => {
    // Redirect immediately
    navigate('/upload');

    // Send webhook in background if we have the data
    if (webhookResponse?.review_id) {
      const finalData = editableData || {
        ERP: webhookResponse.matched?.ERP || mockAgent1Data.ERP,
        CRM: webhookResponse.matched?.CRM || mockAgent1Data.CRM
      };

      const combinedData = {
        ...finalData.ERP,
        ...finalData.CRM
      };

      const payload = {
        review_id: webhookResponse.review_id,
        data: combinedData
      };

      console.log('Sending to webhook in background:', payload);

      // Fire and forget - don't wait for response
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
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Mode
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => {
                        let hasError = false;
                        let parsedMatched, parsedAi1Diff, parsedAi2Diff;

                        try {
                          parsedMatched = JSON.parse(matchedInput);
                          setMatchedError('');
                        } catch (err) {
                          setMatchedError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
                          hasError = true;
                        }

                        try {
                          parsedAi1Diff = JSON.parse(ai1DiffInput);
                          setAi1DiffError('');
                        } catch (err) {
                          setAi1DiffError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
                          hasError = true;
                        }

                        try {
                          parsedAi2Diff = JSON.parse(ai2DiffInput);
                          setAi2DiffError('');
                        } catch (err) {
                          setAi2DiffError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
                          hasError = true;
                        }

                        if (!hasError) {
                          setEditableData({ ...parsedMatched, ...parsedAi1Diff, ...parsedAi2Diff });
                          setMatchedData(parsedMatched);
                          setAi1DiffData(parsedAi1Diff);
                          setAi2DiffData(parsedAi2Diff);
                          setIsEditing(false);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Edit
                    </button>
                  )}
                </div>
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
            {isEditing ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Output</h3>
                  {matchedError && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {matchedError}
                    </div>
                  )}
                  <textarea
                    value={matchedInput}
                    onChange={(e) => {
                      setMatchedInput(e.target.value);
                      setMatchedError('');
                    }}
                    className="w-full h-[250px] p-3 border border-green-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    placeholder='{}'
                  />
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Different Output</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">AI Model 1</h4>
                      {ai1DiffError && (
                        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {ai1DiffError}
                        </div>
                      )}
                      <textarea
                        value={ai1DiffInput}
                        onChange={(e) => {
                          setAi1DiffInput(e.target.value);
                          setAi1DiffError('');
                        }}
                        className="w-full h-[250px] p-3 border border-blue-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder='{}'
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">AI Model 2</h4>
                      {ai2DiffError && (
                        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {ai2DiffError}
                        </div>
                      )}
                      <textarea
                        value={ai2DiffInput}
                        onChange={(e) => {
                          setAi2DiffInput(e.target.value);
                          setAi2DiffError('');
                        }}
                        className="w-full h-[250px] p-3 border border-amber-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                        placeholder='{}'
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">AI Model 1</h4>
                      {ai1DiffData && Object.keys(ai1DiffData).length > 0 ? (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(ai1DiffData, null, 2)}</pre>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No different output found</p>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">AI Model 2</h4>
                      {ai2DiffData && Object.keys(ai2DiffData).length > 0 ? (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(ai2DiffData, null, 2)}</pre>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No different output found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
