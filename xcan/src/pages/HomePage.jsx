/*
Logic Description: This is the main page of the application.
Implementation Guideline: Import and render the necessary components (ImageDropzone, EditableTextArea, FeatureButtons, etc.). Manage the overall layout and state of the page.
Design Description: The main layout should be clean and responsive. Use Shadcn/UI for styling and layout components.
Error Handling: Handle any errors that may occur during page rendering.
*/

import { useState } from 'react';
import ImageDropzone from '../components/upload/ImageDropzone';
import ImagePreview from '../components/upload/ImagePreview';
import EditableTextArea from '../components/textDisplay/EditableTextArea';
import TextWithHighlights from '../components/textDisplay/TextWithHighlights';
import SummarizeButton from '../components/features/SummarizeButton';
import { useImageUpload } from '../hooks/useImageUpload';
import { extractText, summarizeText } from '../services/api';

const HomePage = () => {
  const { image, uploadImage, error: uploadError } = useImageUpload();
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleImageUpload = async (file) => {
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setProcessing(true);
      try {
        const text = await extractText(imageUrl);
        setExtractedText(text);
      } catch (error) {
        console.error('Text extraction failed:', error);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleSummarize = async () => {
    if (!extractedText) return;
    try {
      const summary = await summarizeText(extractedText);
      setSummary(summary);
    } catch (error) {
      console.error('Summarization failed:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Image Text Extractor
      </h1>
      
      <div className="grid md:grid-cols-2 gap-8"></div>
        <div className="space-y-4">
          <ImageDropzone onImageUpload={handleImageUpload} />
          <ImagePreview image={image} />
        </div>
        
        <div className="space-y-4">
          <EditableTextArea
            initialText={extractedText}
            onChange={setExtractedText}
          />
          <SummarizeButton
            onSummarize={handleSummarize}
            disabled={!extractedText || processing}
          />
          {summary && (
            <TextWithHighlights
              text={summary}
              keywords={['important', 'key', 'main']}
            />
          )}
        </div>
      </div>
  );
};

export default HomePage;