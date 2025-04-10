'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Key, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { validateApiKey, API_KEY_STORAGE_KEY } from '@/lib/services/api';
import { toast } from 'sonner';

interface ApiKeyFormProps {
  onSuccess: () => void;
}

export function ApiKeyForm({ onSuccess }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('API Key cannot be empty');
      return;
    }

    setError(null);
    setIsValidating(true);
    
    try {
      const isValid = await validateApiKey(apiKey);
      
      if (isValid) {
        // Store the API key in localStorage
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        
        // Show success toast
        toast.success('API Key validated successfully');
        
        // Call the success callback
        onSuccess();
      } else {
        setError('The API Key provided is invalid. Please check and try again.');
      }
    } catch (error) {
      setError(`Could not validate the API Key. Please try again later. ${error}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full px-4 sm:px-0 sm:max-w-md"
    >
      <Card className="w-full shadow-xl bg-card/90 backdrop-blur-lg border-border/30">
        <CardHeader className="space-y-2">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/5 shadow-[0_0_15px] shadow-blue-500/20 animate-pulse">
            <Sparkles className="h-8 w-8 text-blue-500 animate-glow" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome to XCan</CardTitle>
          <CardDescription className="text-center text-base text-muted-foreground">
            Please enter your Gemini API Key to start
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API Key"
                  className="pl-10 py-6 bg-background/50 border-border/30"
                  disabled={isValidating}
                />
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full py-6 text-base font-medium"
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating
              </>
            ) : (
              'Start'
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Need an API Key? Get it from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium text-semibold"
            >
              Google AI Studio
            </a>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 