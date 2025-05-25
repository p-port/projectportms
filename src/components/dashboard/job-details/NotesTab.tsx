import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Save } from "lucide-react";
import { QuickNotesSelector } from "./QuickNotesSelector";

interface NotesTabProps {
  notes: Array<{ text: string; timestamp: string; author: string }>;
  onAddNote: (noteText: string) => void;
  jobId: string;
  userId: string;
  shopId?: string;
}

export const NotesTab = ({ notes, onAddNote, jobId, userId, shopId }: NotesTabProps) => {
  const [newNote, setNewNote] = useState("");
  const [showQuickNotes, setShowQuickNotes] = useState(true);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  };

  const handleQuickNoteSelect = (noteText: string) => {
    if (newNote) {
      setNewNote(prev => prev + "\n" + noteText);
    } else {
      setNewNote(noteText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddNote();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Notes */}
        <QuickNotesSelector
          onSelectNote={handleQuickNoteSelect}
          userId={userId}
          shopId={shopId}
        />

        {/* Add New Note */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter job note... (Ctrl+Enter to save)"
              className="min-h-32"
            />
            <Button onClick={handleAddNote} disabled={!newNote.trim()} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Existing Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Job Notes History
            <Badge variant="secondary">{notes.length} notes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No notes added yet. Use the quick notes above or write a custom note.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={index} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{note.author}</span>
                    <span className="text-xs text-muted-foreground">{note.timestamp}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
