/*
Logic Description: This custom hook manages the image upload logic.
Implementation Guideline: Use the useState hook to store the uploaded image file and a loading state. Handle file selection and preview generation.
Design Description: (Not applicable for hooks)
Error Handling: Handle invalid file types and size limits.
*/

import { useState, useCallback } from 'react';

export const useImageUpload = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 5MB.');
    }
  };

  const uploadImage = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      validateFile(file);
      setImage(file);
      return URL.createObjectURL(file);
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return {
    image,
    loading,
    error,
    uploadImage,
    clearImage
  };
};