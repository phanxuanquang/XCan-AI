'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="h-8 w-8 p-0 rounded-full bg-background/60 border border-border/20 hover:bg-background/80"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        key={theme}
        className="flex items-center justify-center"
      >
        {theme === 'light' ? (
          <Sun className="h-4 w-4"/>
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </motion.div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 