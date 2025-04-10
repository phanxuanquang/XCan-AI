"use client";

import { useMemo } from "react";
import { Eye } from "lucide-react";

interface OutputPreviewProps {
  htmlCode: string;
  isLoading?: boolean;
}

export function OutputPreview({
  htmlCode,
  isLoading = false,
}: OutputPreviewProps) {
  // Generate the full HTML with tailwind included
  const fullHtml = useMemo(() => {
    if (!htmlCode) return "";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${htmlCode}
        </body>
      </html>
    `;
  }, [htmlCode]);

  return (
    <div className="relative h-full flex flex-col rounded-lg overflow-hidden border border-border">

      <div
        className={`w-full h-full overflow-auto bg-white dark:bg-zinc-900 ${
          isLoading ? "animate-pulse" : ""
        }`}
      >
        {isLoading ? (
          <div className="flex flex-col h-full p-6">
            {/* Header mockup */}
            <div className="space-y-2 mb-8">
              <div className="h-8 bg-gradient-to-r from-blue-100/70 to-blue-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-md w-3/4"></div>
              <div className="h-4 bg-gradient-to-r from-blue-100/60 to-blue-50/40 dark:from-blue-900/15 dark:to-indigo-900/5 rounded-md w-1/2"></div>
            </div>
            
            {/* Content mockup */}
            <div className="flex gap-6 mb-8">
              <div className="w-1/3 aspect-video rounded-lg bg-gradient-to-br from-gray-100/80 to-gray-50/50 dark:from-gray-800/30 dark:to-gray-700/20"></div>
              <div className="w-2/3 space-y-2">
                <div className="h-4 bg-gray-100/80 dark:bg-gray-800/30 rounded-md w-full"></div>
                <div className="h-4 bg-gray-100/60 dark:bg-gray-800/20 rounded-md w-5/6"></div>
                <div className="h-4 bg-gray-100/40 dark:bg-gray-800/10 rounded-md w-4/6"></div>
              </div>
            </div>
            
            {/* More content mockup */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="h-24 bg-gradient-to-br from-purple-100/50 to-pink-50/30 dark:from-purple-900/20 dark:to-pink-900/10 rounded-md"></div>
              <div className="h-24 bg-gradient-to-br from-blue-100/50 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-md"></div>
              <div className="h-24 bg-gradient-to-br from-emerald-100/50 to-green-50/30 dark:from-emerald-900/20 dark:to-green-900/10 rounded-md"></div>
            </div>
            
            {/* Footer mockup */}
            <div className="mt-auto pt-4 border-t border-gray-100/30 dark:border-gray-800/30">
              <div className="h-4 bg-gray-100/60 dark:bg-gray-800/20 rounded-md w-full"></div>
            </div>
          </div>
        ) : !htmlCode ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground">
            <div className="bg-muted/20 p-6 rounded-lg text-center max-w-md">
              <Eye className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">HTML Preview</p>
              <p className="text-sm">Generated HTML will render here after processing your image</p>
            </div>
          </div>
        ) : (
          <iframe
            srcDoc={fullHtml}
            title="HTML Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
}
