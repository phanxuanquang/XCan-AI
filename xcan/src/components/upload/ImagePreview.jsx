/*
Logic Description: Displays the uploaded image for preview.
Implementation Guideline: Use the Shadcn/UI 'Image' component for the actual image display. Handle dynamic resizing of the image within the preview area.
Design Description: A simple preview of the uploaded image.
Error Handling: If no image is uploaded, display a placeholder message.
*/

import { useState } from 'react';
import { Card } from "@/components/ui/card";

const ImagePreview = ({ image }) => {
  const [error, setError] = useState(false);

  if (!image && !error) {
    return (
      <Card className="w-full h-64 flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">No image uploaded</p>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <img
        src={image instanceof File ? URL.createObjectURL(image) : image}
        alt="Preview"
        className="w-full h-auto object-contain max-h-[500px]"
        onError={() => setError(true)}
      />
    </Card>
  );
};

export default ImagePreview;