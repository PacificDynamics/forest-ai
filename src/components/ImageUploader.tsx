import React, { useState, useCallback } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface FileStatus {
  type: 'success' | 'error' | '';
  message: string;
}

interface UploadResponse {
  success?: boolean;
  filename?: string;
  error?: string;
  message?: string;
}

const ImageUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<FileStatus>({ type: '', message: '' });

  const isImage = useCallback((file: File) => {
    return file.type.startsWith('image/');
  }, []);

  const isCsv = useCallback((file: File) => {
    return file.type === 'text/csv' || file.name.endsWith('.csv');
  }, []);

  const isGeotiff = useCallback((file: File) => {
    return file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff');
  }, []);

  const validateFile = useCallback((file: File) => {
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    if (file.size > maxSize) {
      return 'File size exceeds 100MB limit';
    }
    if (!isImage(file) && !isCsv(file) && !isGeotiff(file)) {
      return 'Please select an image, CSV, or GeoTIFF file';
    }
    return null;
  }, [isImage, isCsv, isGeotiff]);

  const createPreview = useCallback((file: File) => {
    if (!isImage(file)) {
      setPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [isImage]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const error = validateFile(selectedFile);
    if (error) {
      setStatus({
        type: 'error',
        message: error
      });
      return;
    }

    setFile(selectedFile);
    createPreview(selectedFile);
    setStatus({ type: '', message: '' });
  }, [validateFile, createPreview]);

  const getUploadIcon = useCallback((file: File | null) => {
    if (!file) return <Camera className="h-12 w-12 text-gray-400" />;
    if (isCsv(file)) return <FileSpreadsheet className="h-12 w-12 text-green-500" />;
    if (isGeotiff(file)) return <Camera className="h-12 w-12 text-blue-500" />;
    return null;
  }, [isCsv, isGeotiff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus({
        type: 'error',
        message: 'Please select a file to upload.'
      });
      return;
    }

    setUploading(true);
    setStatus({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Starting upload for:', file.name, 'Size:', file.size, 'Type:', file.type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      let data: UploadResponse;
      const contentType = response.headers.get('content-type');
      let textResponse = '';
      
      try {
        textResponse = await response.text();
        console.log('Raw response:', textResponse);
        
        if (textResponse) {
          try {
            data = JSON.parse(textResponse);
          } catch {
            data = {
              success: response.ok,
              message: textResponse,
              filename: file.name
            };
          }
        } else {
          data = {
            success: response.ok,
            message: 'Upload completed',
            filename: file.name
          };
        }
      } catch (parseError) {
        console.error('Response parsing error:', parseError);
        throw new Error(`Failed to parse server response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      // Dispatch success event
      const event = new CustomEvent('imageUploaded', {
        detail: { 
          filename: data.filename || file.name,
          htmlFilename: (data.filename || file.name).replace(/\.[^/.]+$/, ".html")
        }
      });
      document.dispatchEvent(event);

      setStatus({
        type: 'success',
        message: `${file.name} uploaded successfully! ${
          isImage(file) ? 'Analysis report' : 'Visualization'
        } will appear on the right.`
      });

      // Reset form state
      setFile(null);
      setPreview('');
    } catch (error) {
      console.error('Upload error:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error 
          ? error.message 
          : 'Failed to upload file. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Forest Data (Image, CSV, or GeoTIFF)
          </label>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.csv,.tif,.tiff"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center space-y-2
                ${file ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}
                hover:border-green-500 transition-colors`}
            >
              {preview ? (
                <div className="relative w-full aspect-video">
                  <img
                    src={preview}
                    alt="Preview"
                    className="rounded absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ) : (
                <>
                  {getUploadIcon(file)}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Supported formats: JPG, PNG, CSV, TIF/TIFF
                  </div>
                </>
              )}
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${uploading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
        >
          {uploading ? (
            <>
              <Upload className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Uploading...
            </>
          ) : (
            'Upload File'
          )}
        </button>

        {status.type && (
          <div
            className={`p-4 rounded-md ${
              status.type === 'success'
                ? 'bg-green-50 dark:bg-green-900'
                : 'bg-red-50 dark:bg-red-900'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {status.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm ${
                    status.type === 'success'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {status.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ImageUploader;