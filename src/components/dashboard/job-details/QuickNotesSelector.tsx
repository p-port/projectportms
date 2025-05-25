
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText } from "lucide-react";

interface QuickNotesProps {
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

export const QuickNotesSelector = ({ onSelectNote, userId, shopId }: QuickNotesProps) => {
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newNote, setNewNote] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    "Service Started",
    "Parts Ordered", 
    "Waiting for Customer",
    "Quality Check",
    "Service Completed",
    "Customer Pickup",
    "General"
  ];

  useEffect(() => {
    fetchQuickNotes();
  }, [userId, shopId]);

  const fetchQuickNotes = async () => {
    try {
      let query = supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', userId);

      if (shopId) {
        query = query.or(`shop_id.eq.${shopId},is_default.eq.true`);
      } else {
        query = query.eq('is_default', true);
      }

      const { data, error } = await query.order('category').order('note_text');

      if (error) throw error;
      setQuickNotes(data || []);
    } catch (error) {
      console.error('Error fetching quick notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !newCategory) {
      toast.error("Please fill in both note and category");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quick_notes')
        .insert({
          user_id: userId,
          shop_id: shopId,
          note_text: newNote.trim(),
          category: newCategory,
          is_default: false
        });

      if (error) throw error;

      toast.success("Quick note added successfully");
      setNewNote("");
      setNewCategory("");
      setShowAddDialog(false);
      fetchQuickNotes();
    } catch (error) {
      console.error('Error adding quick note:', error);
      toast.error("Failed to add quick note");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = selectedCategory 
    ? quickNotes.filter(note => note.category === selectedCategory)
    : quickNotes;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Quick Notes</h4>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
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
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-input">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="hover:bg-muted">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Note Text</label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your quick note..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNote} disabled={loading}>
                  {loading ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-background border-input">
            <SelectItem value="" className="hover:bg-muted">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="hover:bg-muted">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid gap-2 max-h-32 overflow-y-auto">
          {filteredNotes.map((note) => (
            <Button
              key={note.id}
              variant="outline"
              size="sm"
              className="h-auto p-2 text-left justify-start whitespace-normal"
              onClick={() => onSelectNote(note.note_text)}
            >
              <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{note.category}</div>
                <div className="text-sm truncate">{note.note_text}</div>
              </div>
            </Button>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No quick notes available
          </div>
        )}
      </div>
    </div>
  );
};
