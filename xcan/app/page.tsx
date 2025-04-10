'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { ApiKeyForm } from '@/components/auth-wizard/api-key-form';
import { Converter } from '@/components/image-converter/converter';
import { API_KEY_STORAGE_KEY } from '@/lib/services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if API key exists in localStorage
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    setIsAuthenticated(!!apiKey);
    setIsLoading(false);
  }, []);

  // Listen for changes to the API key in localStorage (from API key update dialog)
  useEffect(() => {
    const handleStorageChange = () => {
      const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      setIsAuthenticated(!!apiKey);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-background/90 antialiased">
      <Navbar />
      
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <motion.div
              key="converter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Converter />
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-10rem)]"
            >
              <ApiKeyForm onSuccess={handleAuthSuccess} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
