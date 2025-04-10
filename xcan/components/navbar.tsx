'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { ApiKeyUpdateDialog } from '@/components/auth-wizard/api-key-update-dialog';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">XCan</h1>
          </Link>
        </motion.div>

        <div className="flex items-center gap-3">
          {/* GitHub Repository Link */}
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            className="transition-all hover:scale-105 hover:text-primary hover:bg-primary/10"
          >
            <Link 
              href="https://github.com/phanxuanquang/XCan-AI" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="View source code on GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
          </Button>
          
          {/* API Key Update Dialog */}
          <ApiKeyUpdateDialog />
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 