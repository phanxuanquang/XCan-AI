'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generateHtmlFromImage, API_KEY_STORAGE_KEY } from '@/lib/services/api';

interface ConversionResult {
  htmlCode: string;
  isGenerating: boolean;
  error: string | null;
  generateCode: (imageBase64: string) => Promise<void>;
  reset: () => void;
}

export function useImageConverter(): ConversionResult {
  const [htmlCode, setHtmlCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = useCallback(async (imageBase64: string) => {
    if (!imageBase64) {
      toast.error('Please provide an image first');
      return;
    }

    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) {
      toast.error('API key not found. Please reload the page and enter your API key.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setHtmlCode('');

    try {
      const result = await generateHtmlFromImage(apiKey, imageBase64);
      
      if (result.success && result.data) {
        setHtmlCode(result.data);
        toast.success('Code generated successfully');
      } else {
        setError(result.error || 'Failed to generate code');
        toast.error(result.error || 'Failed to generate code');
      }
    } catch (err) {
      const errorMessage = `An unexpected error occurred. ${err}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHtmlCode('');
    setError(null);
  }, []);

  return {
    htmlCode,
    isGenerating,
    error,
    generateCode,
    reset
  };
} 