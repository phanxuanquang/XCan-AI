'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Key, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { validateApiKey, API_KEY_STORAGE_KEY } from '@/lib/services/api';
import { toast } from 'sonner';

export function ApiKeyUpdateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetDialog = () => {
    setApiKey('');
    setError(null);
    setShowApiKey(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('API Key cannot be empty');
      return;
    }

    // Check if the new key is the same as the current one
    const currentKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (currentKey === apiKey) {
      setError('The new API Key is the same as the current one');
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
        toast.success('API Key updated successfully');
        
        // Close the dialog
        setIsOpen(false);
        resetDialog();
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-sm hover:text-foreground"
        >
          <Key className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Update API Key</DialogTitle>
          <DialogDescription>
            Enter your new Google AI Gemini API Key
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your new Gemini API Key"
                className="pl-10 pr-10 py-6 bg-background/50 border-border/30"
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
        
        <DialogFooter className="flex justify-between gap-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating
              </>
            ) : (
              'Update Key'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 