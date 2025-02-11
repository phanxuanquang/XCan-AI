/*
Logic Description: This component handles the image upload functionality. It allows users to select or drag and drop images.
Implementation Guideline: Use the Shadcn/UI 'Input' component for styling the upload area. Consider using a third-party library for drag-and-drop functionality or implement it yourself using native JavaScript events.
Design Description: A visually appealing area where users can drop images or click to open a file dialog. Should provide feedback while uploading.
Error Handling: Handle invalid image formats and file size limits. Display informative error messages to the user.
*/

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ImageDropzone = ({ onImageUpload }) => {
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size too large. Maximum size is 5MB');
      return;
    }

    setError(null);
    onImageUpload(file);
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    }
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg transition-all
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
          hover:border-primary hover:bg-primary/5`}
      >
        <Input {...getInputProps()} />
        <p className="text-center text-gray-500">
          {isDragActive
            ? "Drop the image here"
            : "Drag & drop an image here, or click to select"}
        </p>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ImageDropzone;