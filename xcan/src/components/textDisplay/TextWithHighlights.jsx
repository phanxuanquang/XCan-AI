import { Badge } from "@/components/ui/badge";

const TextWithHighlights = ({ text, keywords = [] }) => {
  if (!text) return null;

  if (!keywords.length) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (keywords.some(keyword => 
          part.toLowerCase() === keyword.toLowerCase())) {
          return (
            <Badge 
              key={i}
              variant="secondary"
              className="mx-1"
            >
              {part}
            </Badge>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

export default TextWithHighlights;
