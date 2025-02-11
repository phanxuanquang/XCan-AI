/*
Logic Description: Displays the extracted text and allows for editing.
Implementation Guideline: Use a textarea element styled with Shadcn/UI components. Implement editing functionality. Optionally, consider adding syntax highlighting or other text formatting features.
Design Description: A clean and user-friendly text editor area.
Error Handling: Handle cases where no text is available.
*/

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const EditableTextArea = ({ initialText = '', onChange }) => {
  const [text, setText] = useState(initialText);

  const handleChange = (e) => {
    setText(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <Card className="p-4">
      <Textarea
        value={text}
        onChange={handleChange}
        placeholder="No text available..."
        className="min-h-[200px] w-full resize-y"
      />
    </Card>
  );
};

export default EditableTextArea;