/*
Logic Description: This component triggers the summarization functionality.
Implementation Guideline: Upon clicking, make an API request to the backend to generate a summary of the extracted text. Provide clear feedback during processing and display the summary when it's ready.
Design Description: A button clearly labeled "Summarize."  Consider using Shadcn/UI 'Button' component.
Error Handling: Handle API errors and display an informative message to the user if summarization fails.
*/

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SummarizeButton = ({ onSummarize, disabled }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setLoading(true);
      await onSummarize();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate summary. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Summarize
    </Button>
  );
};

export default SummarizeButton;