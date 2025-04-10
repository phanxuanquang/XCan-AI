'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { Check, Copy, RotateCcw, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface CodePreviewProps {
  code: string;
  isLoading?: boolean;
  onCodeChange?: (code: string) => void;
  onRevert?: (() => void) | undefined;
}

// Simple syntax highlighting function
function syntaxHighlight(code: string): string {
  if (!code) return '';
  
  // Replace HTML tags with highlighted versions
  const highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("[^"]*")/g, '<span class="code-string">$1</span>') // Strings
    .replace(/(&lt;\/?)([a-zA-Z0-9-]+)/g, '$1<span class="code-tag">$2</span>') // Tags
    .replace(/class="([^"]*)"/g, 'class="<span class="code-class">$1</span>"') // Classes
    .replace(/([\w-]+)=/g, '<span class="code-attr">$1</span>='); // Attributes
  
  return highlighted;
}

export function CodePreview({ 
  code, 
  isLoading = false,
  onCodeChange,
  onRevert
}: CodePreviewProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState(code);
  
  // Update editableCode when code prop changes
  useEffect(() => {
    setEditableCode(code);
  }, [code]);
  
  // Handle code changes and propagate them to parent
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setEditableCode(newCode);
    
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  // Memoize the highlighted code to avoid recalculating it on every render
  const highlightedCode = useMemo(() => 
    isEditing ? '' : syntaxHighlight(editableCode)
  , [editableCode, isEditing]);

  const copyToClipboard = useCallback(() => {
    if (!editableCode || isLoading) return;
    
    navigator.clipboard.writeText(editableCode)
      .then(() => {
        setIsCopied(true);
        toast.success('Code copied to clipboard');
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch(() => {
        toast.error('Failed to copy code');
      });
  }, [editableCode, isLoading]);

  const toggleEditing = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  return (
    <div className="relative h-full flex flex-col rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-muted px-4 py-1 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium">HTML</span>
          {onRevert && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRevert}
              className="h-7 px-2 text-xs gap-1"
              title="Revert to original"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Revert</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={isEditing ? "default" : "ghost"}
            onClick={toggleEditing}
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            {isEditing ? (
              <>
                <Save className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={copyToClipboard}
            disabled={!code || isLoading}
            className={`h-7 px-2 text-xs ${isCopied ? 'text-green-500' : ''}`}
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div 
        className={`w-full h-full overflow-auto bg-[#1e1e1e] font-mono text-sm ${
          isLoading ? 'opacity-60' : ''
        }`}
      >
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className="h-4 bg-gray-700 rounded" 
                style={{ width: `${Math.floor(Math.random() * 70) + 30}%`, opacity: 1 - (i * 0.03) }} 
              />
            ))}
          </div>
        ) : code ? (
          isEditing ? (
            <textarea
              value={editableCode}
              onChange={handleCodeChange}
              className="w-full h-full border-0 outline-none resize-none bg-[#1e1e1e] text-[#d4d4d4] font-mono text-md whitespace-pre-wrap overflow-hidden"
              spellCheck="false"
              autoFocus
            />
          ) : (
            <pre 
              className={onCodeChange 
                ? "cursor-pointer hover:bg-[#2a2a2a] p-2 rounded transition-colors whitespace-pre-wrap break-words code-highlight"
                : "whitespace-pre-wrap break-words code-highlight"
              }
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
              style={{ color: '#d4d4d4' }}
              onClick={onCodeChange ? toggleEditing : undefined}
              title={onCodeChange ? "Click to edit" : undefined}
              role={onCodeChange ? "button" : undefined}
              tabIndex={onCodeChange ? 0 : undefined}
              onKeyDown={onCodeChange ? (e) => e.key === 'Enter' && toggleEditing() : undefined}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <code className="block text-lg font-semibold mb-2">&lt;/&gt;</code>
              <p>Generated HTML/Tailwind code will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS for code highlighting */}
      <style jsx global>{`
        .code-highlight {
          color: #d4d4d4;
        }
        .code-tag {
          color: #569cd6;
        }
        .code-attr {
          color: #9cdcfe;
        }
        .code-string {
          color: #ce9178;
        }
        .code-class {
          color: #b5cea8;
        }
      `}</style>
    </div>
  );
} 