import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface LogEntry {
  message: string;
  completed: boolean;
}

interface ProgressLogProps {
  onComplete: () => void;
}

export const ProgressLog = ({ onComplete }: ProgressLogProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { webhookResponse, webhookError } = useAppContext();

  const allLogs: LogEntry[] = [
    { message: 'File uploaded', completed: false },
    { message: 'Text extracted from PDF', completed: false },
    { message: 'AI Agent 1 finished', completed: false },
    { message: 'AI Agent 2 finished', completed: false },
    { message: 'Comparing results...', completed: false },
    { message: 'Formatting data for Xero', completed: false },
  ];

  useEffect(() => {
    if (webhookError) {
      setLogs([
        { message: 'Waiting for webhook response...', completed: true },
        { message: 'Error: Failed to upload to webhook', completed: false }
      ]);
      setTimeout(() => {
        setLogs((prev) => [...prev, { message: 'Redirecting back to upload...', completed: true }]);
      }, 500);
      return;
    }

    if (!webhookResponse) {
      setLogs([{ message: 'Waiting for webhook response...', completed: false }]);
      return;
    }

    setLogs([{ message: 'Webhook response received!', completed: true }]);
    setTimeout(() => {
      setLogs((prev) => [...prev, { message: 'Processing complete', completed: true }]);
    }, 500);
  }, [webhookResponse, webhookError]);

  return (
    <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm min-h-[250px]">
      {logs.map((log, index) => (
        <div key={index} className="flex items-center gap-3 mb-3 animate-fade-in">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-green-400">{log.message}</span>
        </div>
      ))}
      {logs.length < allLogs.length && (
        <div className="flex items-center gap-3 text-gray-400 animate-pulse">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};
