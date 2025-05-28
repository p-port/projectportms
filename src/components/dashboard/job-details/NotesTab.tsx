
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EnhancedQuickNotesSelector } from "./EnhancedQuickNotesSelector";
import { useAuthCheck } from "@/hooks/useAuthCheck";

interface NotesTabProps {
  job: any;
  allJobs: any[];
  setJobs: (jobs: any[]) => void;
  onUpdateJob: (updatedJob: any) => void;
  handleStatusChange: (newStatus: string) => Promise<void>;
  updateJobInLocalStorage: (job: any) => Promise<void>;
}

export const NotesTab = ({ 
  job, 
  allJobs, 
  setJobs, 
  onUpdateJob, 
  handleStatusChange, 
  updateJobInLocalStorage 
}: NotesTabProps) => {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { userId } = useAuthCheck();

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      toast.error("Please enter a note before saving");
      return;
    }

    setIsSaving(true);
    try {
      const newNote = {
        text: notes,
        timestamp: new Date().toISOString(),
        userId: userId
      };

      const existingNotes = Array.isArray(job.notes) ? job.notes : [];
      const updatedJob = { 
        ...job, 
        notes: [...existingNotes, newNote]
      };
      
      await onUpdateJob(updatedJob);

      // Update the job in the local state
      const updatedJobs = allJobs.map((j) => (j.id === job.id ? updatedJob : j));
      setJobs(updatedJobs);

      // Update local storage
      await updateJobInLocalStorage(updatedJob);

      setNotes(""); // Clear the input after saving
      toast.success("Note saved successfully!");
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickNoteSelect = (noteText: string) => {
    // Automatically add the quick note and save it
    const quickSaveNote = async () => {
      try {
        const newNote = {
          text: noteText,
          timestamp: new Date().toISOString(),
          userId: userId
        };

        const existingNotes = Array.isArray(job.notes) ? job.notes : [];
        const updatedJob = { 
          ...job, 
          notes: [...existingNotes, newNote]
        };
        
        await onUpdateJob(updatedJob);

        // Update the job in the local state
        const updatedJobs = allJobs.map((j) => (j.id === job.id ? updatedJob : j));
        setJobs(updatedJobs);

        // Update local storage
        await updateJobInLocalStorage(updatedJob);

        toast.success("Quick note added successfully!");
      } catch (error: any) {
        console.error("Error adding quick note:", error);
        toast.error(error.message || "Failed to add quick note");
      }
    };

    quickSaveNote();
  };

  const handleStatusChangeLocal = async (newStatus: string) => {
    try {
      await handleStatusChange(newStatus);
    } catch (error: any) {
      console.error("Error changing status:", error);
      toast.error(error.message || "Failed to change status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on-hold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const displayNotes = Array.isArray(job.notes) ? job.notes : [];

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Job Status</h3>
        <div className="flex items-center gap-4">
          <Badge className={`${getStatusColor(job.status)} capitalize`}>
            {job.status?.replace("-", " ") || "Unknown"}
          </Badge>
          <Select value={job.status} onValueChange={handleStatusChangeLocal}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Notes Section - Always show this */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Quick Notes</h3>
        <EnhancedQuickNotesSelector 
          onSelectNote={handleQuickNoteSelect}
          userId={userId || ""}
          shopId={job.shopId || job.shop_id}
        />
      </div>

      {/* Add New Note */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Custom Note</h3>
        <Textarea
          placeholder="Add custom notes about the job here..."
          value={notes}
          onChange={handleNotesChange}
          className="w-full min-h-[100px]"
        />
        <Button onClick={handleSaveNotes} disabled={isSaving || !notes.trim()}>
          {isSaving ? "Saving..." : "Save Note"}
        </Button>
      </div>

      {/* Existing Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notes History</h3>
        {displayNotes.length > 0 ? (
          <div className="space-y-3">
            {displayNotes.map((note: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-muted-foreground">
                    Note #{displayNotes.length - index}
                  </span>
                  {note.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(note.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {typeof note === 'string' ? note : note.text || note.content || 'No content'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No notes added yet. Use quick notes above or add a custom note.
          </p>
        )}
      </div>
    </div>
  );
};
