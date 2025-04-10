"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertCircle, Code, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dropzone } from "@/components/image-converter/dropzone";
import { OutputPreview } from "@/components/image-converter/output-preview";
import { CodePreview } from "@/components/image-converter/code-preview";
import { useImageConverter } from "@/lib/hooks/use-image-converter";

export function Converter() {
  const [imageBase64, setImageBase64] = useState("");
  const {
    htmlCode,
    isGenerating,
    error,
    generateCode,
    reset,
  } = useImageConverter();
  const [activeTab, setActiveTab] = useState("preview");
  const [editedHtmlCode, setEditedHtmlCode] = useState("");
  const [hasEdits, setHasEdits] = useState(false);

  // Ref for calculating remaining height
  const converterRef = useRef<HTMLDivElement>(null);
  const [outputHeight, setOutputHeight] = useState("720px");

  // Show output section only when we have HTML code or are generating it
  const showOutput = htmlCode || isGenerating;

  // Calculate the remaining height for the output section
  useEffect(() => {
    const calculateRemainingHeight = () => {
      if (!converterRef.current || !showOutput) return;

      const converterTop = converterRef.current.getBoundingClientRect().top;
      const inputSectionHeight =
        converterRef.current.querySelector("section")?.clientHeight || 0;
      const bufferSpace = 160; // Space for nav, padding, margins, etc.

      const remainingHeight =
        window.innerHeight - converterTop - inputSectionHeight - bufferSpace;
      setOutputHeight(`${Math.max(500, remainingHeight)}px`);
    };

    calculateRemainingHeight();
    window.addEventListener("resize", calculateRemainingHeight);

    return () => window.removeEventListener("resize", calculateRemainingHeight);
  }, [imageBase64, htmlCode, showOutput]);

  // Update editedHtmlCode when htmlCode changes
  useEffect(() => {
    if (htmlCode) {
      setEditedHtmlCode(htmlCode);
      setHasEdits(false);
    }
  }, [htmlCode]);

  const handleImageChange = (base64: string) => {
    setImageBase64(base64);

    // Auto-generate when an image is provided
    if (base64) {
      generateCode(base64);
    } else {
      // Reset if image is cleared
      reset();
    }
  };

  const handleReset = () => {
    setImageBase64("");
    reset();
    setEditedHtmlCode("");
    setHasEdits(false);
  };

  const handleCodeChange = (newCode: string) => {
    setEditedHtmlCode(newCode);
    setHasEdits(newCode !== htmlCode);
  };

  const handleRevertEdits = () => {
    setEditedHtmlCode(htmlCode);
    setHasEdits(false);
  };

  return (
    <div
      ref={converterRef}
      className="w-full h-full min-h-screen flex flex-col"
    >
      <div
        className={`flex flex-col flex-grow ${
          !showOutput ? "justify-center" : "pt-8"
        } px-4 max-w-6xl mx-auto w-full`}
      >
        {/* Input Section */}
        <section className={`w-full ${!showOutput ? "max-w-5xl mx-auto" : ""}`}>
          <div className={`${!showOutput ? "transform -translate-y-16" : ""}`}>
            <Dropzone
              onImageChange={handleImageChange}
              disabled={isGenerating}
              className="w-full h-[480px]"
              imageBase64={imageBase64}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleReset}
                disabled={!imageBase64 || isGenerating}
                className="w-full"
              >
                Clear
              </Button>
              <Button
                size="lg"
                onClick={() => generateCode(imageBase64)}
                disabled={!imageBase64 || isGenerating}
                className="w-full bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </>
                ) : imageBase64 && !htmlCode ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output Section - Only shown after generation */}
        <AnimatePresence>
          {showOutput && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="w-full mt-10"
            >
              <Tabs
                defaultValue="preview"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>Code</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-0">
                  <div className="w-full" style={{ height: outputHeight }}>
                    <OutputPreview
                      htmlCode={editedHtmlCode}
                      isLoading={isGenerating}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-0">
                  <div className="w-full" style={{ height: outputHeight }}>
                    <CodePreview
                      code={editedHtmlCode}
                      isLoading={isGenerating}
                      onCodeChange={handleCodeChange}
                      onRevert={hasEdits ? handleRevertEdits : undefined}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Add the shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(100%) skewX(-12deg);
          }
        }

        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  );
}
