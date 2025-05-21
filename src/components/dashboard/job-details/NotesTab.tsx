
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NotesTabProps {
  currentJob: any;
  onUpdateJob: (updatedJob: any) => void;
  handleStatusChange: (status: string) => void;
  updateJobInLocalStorage: (job: any) => void;
}

export const NotesTab = ({
  currentJob,
  onUpdateJob,
  handleStatusChange,
  updateJobInLocalStorage
}: NotesTabProps) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    setIsSubmitting(true);

    const updatedJob = {
      ...currentJob,
      notes: [
        ...currentJob.notes,
        {
          text: newNote,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      // Update in Supabase if possible
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { error } = await supabase.from('jobs').update({
          notes: updatedJob.notes
        }).eq('job_id', currentJob.id);
        
        if (error) {
          console.error("Error updating notes in Supabase:", error);
          throw error;
        }
      }
      
      // Update locally
      setNewNote("");
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      toast.success("Note added successfully");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">Job Notes</h3>
        
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Add a note about this job..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={handleAddNote} 
            className="self-end"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Note"}
          </Button>
        </div>

        <div className="space-y-4 mt-4">
          <h4 className="font-medium">Notes History</h4>
          {currentJob.notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notes yet</p>
          ) : (
            <div className="space-y-3">
              {currentJob.notes.map((note: any, index: number) => {
                // Format the timestamp for display
                const date = new Date(note.timestamp);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                
                return (
                  <div key={index} className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formattedDate}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Update Job Status</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={currentJob.status === "pending" ? "default" : "outline"}
            onClick={() => handleStatusChange("pending")}
            className="justify-start"
            disabled={currentJob.status === "completed"}
          >
            Pending
          </Button>
          <Button
            variant={currentJob.status === "in-progress" ? "default" : "outline"}
            onClick={() => handleStatusChange("in-progress")}
            className="justify-start"
            disabled={currentJob.status === "completed"}
          >
            In Progress
          </Button>
          <Button
            variant={currentJob.status === "on-hold" ? "default" : "outline"}
            onClick={() => handleStatusChange("on-hold")}
            className="justify-start"
            disabled={currentJob.status === "completed"}
          >
            On Hold
          </Button>
          <Button
            variant={currentJob.status === "completed" ? "default" : "outline"}
            onClick={() => handleStatusChange("completed")}
            className="justify-start"
          >
            Completed
          </Button>
        </div>
      </div>
    </div>
  );
};
