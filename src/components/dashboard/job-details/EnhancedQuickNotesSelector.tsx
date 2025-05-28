
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus } from "lucide-react";

interface EnhancedQuickNotesSelectorProps {
  onSelectNote: (noteText: string) => void;
  userId: string;
  shopId?: string;
}

interface QuickNote {
  id: string;
  note_text: string;
  category: string;
  is_default: boolean;
}

export const EnhancedQuickNotesSelector = ({ 
  onSelectNote, 
  userId, 
  shopId 
}: EnhancedQuickNotesSelectorProps) => {
  const [customNotes, setCustomNotes] = useState<QuickNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Predefined quick notes
  const defaultQuickNotes = [
    { text: "Inspection completed - all systems normal", category: "Inspection" },
    { text: "Oil change performed - next service in 3000km", category: "Maintenance" },
    { text: "Brake pads replaced - test ride completed", category: "Repair" },
    { text: "Tire pressure checked and adjusted", category: "Maintenance" },
    { text: "Battery tested - functioning properly", category: "Inspection" },
    { text: "Chain cleaned and lubricated", category: "Maintenance" },
    { text: "Lights and signals tested - all working", category: "Inspection" },
    { text: "Coolant level checked and topped up", category: "Maintenance" },
    { text: "Spark plugs replaced", category: "Repair" },
    { text: "Air filter cleaned/replaced", category: "Maintenance" },
    { text: "Transmission fluid checked", category: "Inspection" },
    { text: "Suspension inspected - no issues found", category: "Inspection" }
  ];

  useEffect(() => {
    if (userId && shopId) {
      fetchCustomQuickNotes();
    }
  }, [userId, shopId]);

  const fetchCustomQuickNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('shop_id', shopId)
        .eq('is_default', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomNotes(data || []);
    } catch (error) {
      console.error('Error fetching custom quick notes:', error);
    }
  };

  const handleQuickNoteClick = (noteText: string) => {
    onSelectNote(noteText);
    toast.success("Quick note added to notes field");
  };

  const handleAddCustomNote = async () => {
    if (!newNoteText.trim() || !newNoteCategory.trim()) {
      toast.error("Please enter both note text and category");
      return;
    }

    if (!shopId) {
      toast.error("Shop information not available");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quick_notes')
        .insert({
          user_id: userId,
          shop_id: shopId,
          note_text: newNoteText.trim(),
          category: newNoteCategory.trim(),
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      setCustomNotes(prev => [data, ...prev]);
      setNewNoteText("");
      setNewNoteCategory("");
      toast.success("Custom quick note added successfully");
    } catch (error: any) {
      console.error('Error adding custom quick note:', error);
      toast.error("Failed to add custom quick note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('quick_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) throw error;

      setCustomNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success("Custom quick note deleted");
    } catch (error: any) {
      console.error('Error deleting custom quick note:', error);
      toast.error("Failed to delete custom quick note");
    }
  };

  const groupedDefaultNotes = defaultQuickNotes.reduce((acc, note) => {
    if (!acc[note.category]) {
      acc[note.category] = [];
    }
    acc[note.category].push(note);
    return acc;
  }, {} as Record<string, typeof defaultQuickNotes>);

  const groupedCustomNotes = customNotes.reduce((acc, note) => {
    if (!acc[note.category]) {
      acc[note.category] = [];
    }
    acc[note.category].push(note);
    return acc;
  }, {} as Record<string, QuickNote[]>);

  return (
    <div className="space-y-6">
      {/* Predefined Quick Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedDefaultNotes).map(([category, notes]) => (
            <div key={category} className="space-y-2">
              <Badge variant="outline" className="text-xs">{category}</Badge>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {notes.map((note, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-3 text-left justify-start whitespace-normal"
                    onClick={() => handleQuickNoteClick(note.text)}
                  >
                    {note.text}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Quick Notes */}
      {userId && shopId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Quick Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new custom note */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="noteCategory">Category</Label>
                  <Input
                    id="noteCategory"
                    placeholder="e.g., Repair, Maintenance"
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="noteText">Note Text</Label>
                <Textarea
                  id="noteText"
                  placeholder="Enter your custom quick note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <Button 
                onClick={handleAddCustomNote} 
                disabled={isLoading || !newNoteText.trim() || !newNoteCategory.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Quick Note
              </Button>
            </div>

            {/* Display custom notes */}
            {Object.keys(groupedCustomNotes).length > 0 && (
              <div className="space-y-4">
                {Object.entries(groupedCustomNotes).map(([category, notes]) => (
                  <div key={category} className="space-y-2">
                    <Badge variant="secondary" className="text-xs">{category}</Badge>
                    <div className="grid grid-cols-1 gap-2">
                      {notes.map((note) => (
                        <div key={note.id} className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-auto p-3 text-left justify-start whitespace-normal"
                            onClick={() => handleQuickNoteClick(note.note_text)}
                          >
                            {note.note_text}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCustomNote(note.id)}
                            className="h-10 w-10 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(groupedCustomNotes).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No custom quick notes yet. Add your first one above.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
