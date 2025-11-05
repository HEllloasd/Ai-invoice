import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { WEBHOOKS } from '../config/webhooks';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadSuccess: () => void;
}

export const FileUpload = ({ onFileSelect, onUploadSuccess }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { setWebhookResponse, setWebhookError } = useAppContext();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError(null);
      onFileSelect(file);

      // Upload to webhook first, then navigate
      const success = await uploadToWebhook(file);
      if (success) {
        onUploadSuccess();
      } else {
        setUploadError('Failed to upload file to webhook. Please check the webhook URL.');
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;

    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError(null);
      onFileSelect(file);

      // Upload to webhook first, then navigate
      const success = await uploadToWebhook(file);
      if (success) {
        onUploadSuccess();
      } else {
        setUploadError('Failed to upload file to webhook. Please check the webhook URL.');
      }
    }
  };

  const uploadToSupabase = async (file: File): Promise<{ success: boolean; review_id?: string }> => {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create a review record
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          file_name: file.name,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (reviewError) throw reviewError;

      return { success: true, review_id: reviewData?.review_id };
    } catch (error) {
      console.error('Supabase upload failed:', error);
      return { success: false };
    }
  };

  const uploadToWebhook = async (file: File): Promise<boolean> => {
    if (isUploading) {
      console.log('Upload already in progress, skipping...');
      return false;
    }

    setIsUploading(true);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller with shorter timeout (30 seconds)
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 30000); // 30 seconds timeout

    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const response = await fetch(WEBHOOKS.pdf.dropbox, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Webhook upload failed with status: ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Helper function to transform model_a/model_b to ERP/CRM
      const transformData = (obj: any) => {
        if (!obj) return obj;

        const transformed = { ...obj };

        if (obj.matched) {
          transformed.matched = {
            ERP: obj.matched.model_a || obj.matched.ERP,
            CRM: obj.matched.model_b || obj.matched.CRM
          };
        }

        if (obj.differences) {
          transformed.differences = {
            ERP: obj.differences.model_a || obj.differences.ERP,
            CRM: obj.differences.model_b || obj.differences.CRM
          };
        }

        return transformed;
      };

      const transformedData = transformData(data);

      if (transformedData.review_id) {
        // Update the review record with the filename
        await supabase
          .from('reviews')
          .update({ file_name: file.name })
          .eq('review_id', transformedData.review_id);

        const { data: reviewData, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('review_id', transformedData.review_id)
          .maybeSingle();

        if (!error && reviewData) {
          // Transform data from database as well
          setWebhookResponse(transformData(reviewData));
        } else {
          setWebhookResponse(transformedData);
        }
      } else {
        setWebhookResponse(transformedData);
      }

      console.log('File uploaded successfully to webhook', data);
      setIsUploading(false);
      return true;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.warn('Webhook failed, attempting Supabase fallback:', error);

      // Fallback to Supabase Storage
      const fallbackResult = await uploadToSupabase(file);

      if (fallbackResult.success) {
        console.log('File uploaded successfully to Supabase Storage');
        setUploadError('Webhook unavailable. File saved for later processing.');
        setWebhookError(true);

        // Set a basic response so the app can continue
        setWebhookResponse({
          review_id: fallbackResult.review_id,
          status: 'pending',
          message: 'File uploaded to storage, awaiting processing'
        });

        setIsUploading(false);
        return true; // Continue to next step
      } else {
        setUploadError('Failed to upload file. Please try again.');
        setWebhookError(true);
        setIsUploading(false);
        return false;
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
        isDragging
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInput}
        className="hidden"
      />

      {selectedFile && !uploadError ? (
        <div className="flex flex-col items-center gap-3">
          <FileText className="w-16 h-16 text-blue-600" />
          <div>
            <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <p className="text-sm text-blue-600 mt-2">Click to change file</p>
        </div>
      ) : uploadError ? (
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-16 h-16 text-red-600" />
          <div>
            <p className="text-lg font-medium text-gray-900">Upload Failed</p>
            <p className="text-sm text-red-600 mt-2 max-w-md">{uploadError}</p>
          </div>
          <p className="text-sm text-blue-600 mt-2 font-medium">Click to try again</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-16 h-16 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drag & drop your invoice PDF here
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to select a file</p>
          </div>
        </div>
      )}
    </div>
  );
};
