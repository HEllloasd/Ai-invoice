import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { CheckCircle, FileText, Download } from 'lucide-react';

export const Success = () => {
  const navigate = useNavigate();

  const displayData = {
    model: 'AI Agent',
    ERP: {
      Type: 'ACCREC',
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

  const handleDownload = (type: string) => {
    alert(`Downloading ${type} export...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-6">
              <CheckCircle className="w-20 h-20 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Invoice Successfully Processed!
          </h1>

          <p className="text-gray-600 text-lg mb-8 text-center">
            Your extracted data is ready for export
          </p>

          {displayData && (
            <>
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Invoice Summary</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">ERP Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-semibold text-gray-900">{displayData.ERP?.Contact?.Name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-semibold text-gray-900">{displayData.ERP?.Date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-semibold text-gray-900">{displayData.ERP?.DueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Line Items:</span>
                        <span className="font-semibold text-gray-900">{displayData.ERP?.LineItems?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">CRM Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company:</span>
                        <span className="font-semibold text-gray-900">{displayData.CRM?.Name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold text-gray-900">{displayData.CRM?.EmailAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                  Export Options
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDownload('ERP Excel')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Download className="w-8 h-8 text-blue-600" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">Download ERP Excel</div>
                      <div className="text-xs text-gray-600 mt-1">Export invoice to spreadsheet</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDownload('CRM Excel')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <Download className="w-8 h-8 text-green-600" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">Download CRM Excel</div>
                      <div className="text-xs text-gray-600 mt-1">Export contacts to spreadsheet</div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-center">
            <Button onClick={() => navigate('/upload')}>
              Upload Another Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
