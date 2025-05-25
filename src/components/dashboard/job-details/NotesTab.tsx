import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [notes, setNotes] = useState(job?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const updatedJob = { ...job, notes: notes };
      await onUpdateJob(updatedJob);

      // Optimistically update the job in the local state
      const updatedJobs = allJobs.map((j) => (j.id === job.id ? updatedJob : j));
      setJobs(updatedJobs);

      // Update local storage
      await updateJobInLocalStorage(updatedJob);

      toast.success("Notes saved successfully!");
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Textarea
          placeholder="Add notes about the job here..."
          value={notes}
          onChange={handleNotesChange}
          className="w-full"
        />
      </div>
      <div>
        <Button onClick={handleSaveNotes} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Notes"}
        </Button>
      </div>
    </div>
  );
};
