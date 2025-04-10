'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface DropzoneProps {
  onImageChange: (base64: string) => void;
  className?: string;
  disabled?: boolean;
  imageBase64?: string; // Add prop to reset when parent clears
}

export function Dropzone({ 
  onImageChange, 
  className = '', 
  disabled = false,
  imageBase64 = ''
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reset preview when imageBase64 is empty (cleared by parent)
  useEffect(() => {
    if (!imageBase64) {
      setPreviewUrl(null);
    } else if (imageBase64 && !previewUrl) {
      setPreviewUrl(imageBase64);
    }
  }, [imageBase64, previewUrl]);

  const handleImageUpload = useCallback(
    (file: File) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Unsupported file type. Please use PNG, JPG, or WEBP.');
        return;
      }

      // Check file size (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        toast.error('Image size exceeds the 10MB limit.');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreviewUrl(base64);
        onImageChange(base64);
      };
      reader.readAsDataURL(file);
    },
    [onImageChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (disabled) return;
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    },
    [disabled, handleImageUpload]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      
      if (e.target.files && e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
      }
    },
    [disabled, handleImageUpload]
  );

  // Setup global paste handler for the entire document to catch Ctrl+V anywhere
  useEffect(() => {
    if (disabled) return;

    const handlePasteAnywhere = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) handleImageUpload(file);
          toast.success('Image pasted from clipboard');
          break;
        }
      }
    };

    document.addEventListener('paste', handlePasteAnywhere);
    return () => {
      document.removeEventListener('paste', handlePasteAnywhere);
    };
  }, [disabled, handleImageUpload]);

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
          isDragging
            ? 'border-primary/90 bg-primary/10'
            : 'border-border/70 bg-background/30'
        } ${
          disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
        } h-full flex flex-col items-center justify-center p-3 backdrop-blur-sm overflow-hidden`}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="rounded-full bg-primary/10 p-4">
              <ImageIcon className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Drag and drop your image here</p>
              <p className="text-sm text-muted-foreground">
                Supports PNG, JPG, WEBP images up to 10MB
              </p>
              <p className="text-xs text-muted-foreground">
                You can also paste (Ctrl+V) from clipboard
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </motion.div>
          </motion.div>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
} 