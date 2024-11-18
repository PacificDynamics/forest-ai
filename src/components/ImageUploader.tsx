import React, { useState } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const ImageUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('nextdrought@gmail.com'); // Default email
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setStatus({
          type: 'error',
          message: 'Please select an image file.'
        });
        return;
      }

      setFile(selectedFile);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setStatus({ type: '', message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus({
        type: 'error',
        message: 'Please select an image to upload.'
      });
      return;
    }

    setUploading(true);
    setStatus({ type: '', message: '' });

    try {
      // Upload directly to S3
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setStatus({
        type: 'success',
        message: 'Image uploaded successfully! Check your email for the analysis report.'
      });

      // Reset form
      setFile(null);
      setPreview('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Forest Image
          </label>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center space-y-2
                ${preview ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}
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
                  <Camera className="h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Supported formats: JPG, PNG
                  </div>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || uploading}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${
              uploading || !file
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
            'Upload Image'
          )}
        </button>

        {/* Status Message */}
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
