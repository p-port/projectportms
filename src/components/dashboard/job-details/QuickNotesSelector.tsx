
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, X, Edit2 } from "lucide-react";

interface QuickNote {
  id: string;
  category: string;
  note_text: string;
  is_default: boolean;
  user_id: string;
  shop_id?: string;
}

interface QuickNotesSelectorProps {
  onSelectNote: (noteText: string) => void;
  userId: string;
  shopId?: string;
}

export const QuickNotesSelector = ({ onSelectNote, userId, shopId }: QuickNotesSelectorProps) => {
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNote, setNewNote] = useState({ category: "", note_text: "" });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["Maintenance", "Electrical", "Tires", "Brakes", "Engine", "Body", "Other"];

  useEffect(() => {
    fetchQuickNotes();
  }, [userId, shopId]);

  const fetchQuickNotes = async () => {
    try {
      setLoading(true);
      
      // Fetch user's personal notes and shop notes
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .or(`user_id.eq.${userId},shop_id.eq.${shopId}`)
        .order('category', { ascending: true })
        .order('note_text', { ascending: true });

      if (error) throw error;
      
      // Add some default notes if none exist
      if (!data || data.length === 0) {
        await createDefaultNotes();
        return fetchQuickNotes();
      }
      
      setQuickNotes(data);
    } catch (error) {
      console.error("Error fetching quick notes:", error);
      toast.error("Failed to load quick notes");
    } finally {
      setLoading(false);
    }
  };

  const createDefaultNotes = async () => {
    const defaultNotes = [
      { category: "Maintenance", note_text: "Oil change completed" },
      { category: "Maintenance", note_text: "Chain cleaned and lubricated" },
      { category: "Maintenance", note_text: "Air filter replaced" },
      { category: "Electrical", note_text: "Battery tested - good condition" },
      { category: "Electrical", note_text: "Headlight bulb replaced" },
      { category: "Tires", note_text: "Tire pressure adjusted" },
      { category: "Tires", note_text: "Front tire replaced" },
      { category: "Brakes", note_text: "Brake pads replaced" },
      { category: "Brakes", note_text: "Brake fluid changed" },
      { category: "Engine", note_text: "Engine diagnostics completed" }
    ];

    try {
      const notesToInsert = defaultNotes.map(note => ({
        ...note,
        user_id: userId,
        shop_id: shopId,
        is_default: true
      }));

      const { error } = await supabase
        .from('quick_notes')
        .insert(notesToInsert);

      if (error) throw error;
    } catch (error) {
      console.error("Error creating default notes:", error);
    }
  };

  const addQuickNote = async () => {
    if (!newNote.category || !newNote.note_text) {
      toast.error("Please fill in both category and note text");
      return;
    }

    try {
      const { error } = await supabase
        .from('quick_notes')
        .insert({
          category: newNote.category,
          note_text: newNote.note_text,
          user_id: userId,
          shop_id: shopId,
          is_default: false
        });

      if (error) throw error;

      toast.success("Quick note added");
      setNewNote({ category: "", note_text: "" });
      setShowAddDialog(false);
      fetchQuickNotes();
    } catch (error) {
      console.error("Error adding quick note:", error);
      toast.error("Failed to add quick note");
    }
  };

  const deleteQuickNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('quick_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success("Quick note deleted");
      fetchQuickNotes();
    } catch (error) {
      console.error("Error deleting quick note:", error);
      toast.error("Failed to delete quick note");
    }
  };

  const filteredNotes = selectedCategory 
    ? quickNotes.filter(note => note.category === selectedCategory)
    : quickNotes;

  const notesByCategory = categories.reduce((acc, category) => {
    acc[category] = quickNotes.filter(note => note.category === category);
    return acc;
  }, {} as Record<string, QuickNote[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">Loading quick notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Quick Notes</CardTitle>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Quick Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Note Text</label>
                <Input
                  value={newNote.note_text}
                  onChange={(e) => setNewNote({ ...newNote, note_text: e.target.value })}
                  placeholder="Enter note text"
                  className="mt-1"
                />
              </div>
              <Button onClick={addQuickNote} className="w-full">
                Add Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
              {notesByCategory[category]?.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 text-xs">
                  {notesByCategory[category].length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Quick Notes Grid */}
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-center justify-between p-2 border rounded-md hover:bg-muted cursor-pointer group"
            >
              <div
                className="flex-1"
                onClick={() => onSelectNote(note.note_text)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {note.category}
                  </Badge>
                  {note.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-1">{note.note_text}</p>
              </div>
              {!note.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteQuickNote(note.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No quick notes available
            {selectedCategory && ` for ${selectedCategory}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
