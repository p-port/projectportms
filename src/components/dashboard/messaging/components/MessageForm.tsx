
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MessageFormProps {
  subject: string;
  content: string;
  onSubjectChange: (subject: string) => void;
  onContentChange: (content: string) => void;
}

export const MessageForm = ({ 
  subject, 
  content, 
  onSubjectChange, 
  onContentChange 
}: MessageFormProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input 
          id="subject" 
          value={subject} 
          onChange={(e) => onSubjectChange(e.target.value)} 
          placeholder="Message subject" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Message</Label>
        <Textarea 
          id="content" 
          value={content} 
          onChange={(e) => onContentChange(e.target.value)} 
          placeholder="Type your message here..." 
          rows={8}
        />
      </div>
    </>
  );
};
