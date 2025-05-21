
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NotesTabProps {
  currentJob: any;
  onUpdateJob: (updatedJob: any) => void;
  handleStatusChange: (status: string) => void;
  updateJobInLocalStorage: (job: any) => void;
}

// Add translations for NotesTab
const notesTranslations = {
  en: {
    jobNotes: "Job Notes",
    addNote: "Add a note about this job...",
    adding: "Adding...",
    addNoteBtn: "Add Note",
    notesHistory: "Notes History",
    noNotes: "No notes yet",
    updateJobStatus: "Update Job Status",
    pending: "Pending",
    inProgress: "In Progress",
    onHold: "On Hold",
    completed: "Completed",
    noteEmpty: "Note cannot be empty",
    noteAdded: "Note added successfully",
    noteFailed: "Failed to add note. Please try again.",
    deleteNote: "Delete note",
    deleteConfirmTitle: "Delete Note",
    deleteConfirmDescription: "Are you sure you want to delete this note? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    noteDeleted: "Note deleted successfully",
    deleteNoteFailed: "Failed to delete note. Please try again."
  },
  ko: {
    jobNotes: "작업 노트",
    addNote: "이 작업에 대한 메모를 추가하세요...",
    adding: "추가 중...",
    addNoteBtn: "노트 추가",
    notesHistory: "노트 기록",
    noNotes: "아직 노트가 없습니다",
    updateJobStatus: "작업 상태 업데이트",
    pending: "대기 중",
    inProgress: "진행 중",
    onHold: "보류 중",
    completed: "완료됨",
    noteEmpty: "노트는 비워둘 수 없습니다",
    noteAdded: "노트가 성공적으로 추가되었습니다",
    noteFailed: "노트 추가에 실패했습니다. 다시 시도해 주세요.",
    deleteNote: "노트 삭제",
    deleteConfirmTitle: "노트 삭제",
    deleteConfirmDescription: "이 노트를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.",
    cancel: "취소",
    delete: "삭제",
    noteDeleted: "노트가 성공적으로 삭제되었습니다",
    deleteNoteFailed: "노트 삭제에 실패했습니다. 다시 시도해 주세요."
  },
  ru: {
    jobNotes: "Заметки о заказе",
    addNote: "Добавить заметку об этом заказе...",
    adding: "Добавление...",
    addNoteBtn: "Добавить заметку",
    notesHistory: "История заметок",
    noNotes: "Пока нет заметок",
    updateJobStatus: "Обновить статус заказа",
    pending: "В ожидании",
    inProgress: "В процессе",
    onHold: "На удержании",
    completed: "Завершено",
    noteEmpty: "Заметка не может быть пустой",
    noteAdded: "Заметка успешно добавлена",
    noteFailed: "Не удалось добавить заметку. Пожалуйста, попробуйте снова.",
    deleteNote: "Удалить заметку",
    deleteConfirmTitle: "Удалить заметку",
    deleteConfirmDescription: "Вы уверены, что хотите удалить эту заметку? Это действие нельзя отменить.",
    cancel: "Отмена",
    delete: "Удалить",
    noteDeleted: "Заметка успешно удалена",
    deleteNoteFailed: "Не удалось удалить заметку. Пожалуйста, попробуйте снова."
  }
};

export const NotesTab = ({
  currentJob,
  onUpdateJob,
  handleStatusChange,
  updateJobInLocalStorage
}: NotesTabProps) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language] = useLocalStorage("language", "en");
  const [noteToDelete, setNoteToDelete] = useState<{ index: number; text: string } | null>(null);
  
  const t = notesTranslations[language as keyof typeof notesTranslations];

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error(t.noteEmpty);
      return;
    }

    setIsSubmitting(true);

    // Store the note with original text in multiple languages for future translation display
    // In a real app, you would use translation APIs here
    const updatedJob = {
      ...currentJob,
      notes: [
        ...currentJob.notes,
        {
          text: newNote,
          timestamp: new Date().toISOString(),
          originalTexts: {
            en: newNote,
            // These would typically be translated using an API like Google Translate
            // This is a simplification for demonstration purposes
            ko: language === "ko" ? newNote : undefined,
            ru: language === "ru" ? newNote : undefined
          }
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
      toast.success(t.noteAdded);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error(t.noteFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (noteToDelete === null) return;

    try {
      // Create a copy of the notes array without the deleted note
      const updatedNotes = [...currentJob.notes];
      updatedNotes.splice(noteToDelete.index, 1);

      const updatedJob = {
        ...currentJob,
        notes: updatedNotes,
      };

      // Update in Supabase if possible
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { error } = await supabase.from('jobs').update({
          notes: updatedNotes
        }).eq('job_id', currentJob.id);
        
        if (error) {
          console.error("Error deleting note in Supabase:", error);
          throw error;
        }
      }

      // Update locally
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      toast.success(t.noteDeleted);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(t.deleteNoteFailed);
    } finally {
      setNoteToDelete(null);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">{t.jobNotes}</h3>
        
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder={t.addNote}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={handleAddNote} 
            className="self-end"
            disabled={isSubmitting}
          >
            {isSubmitting ? t.adding : t.addNoteBtn}
          </Button>
        </div>

        <div className="space-y-4 mt-4">
          <h4 className="font-medium">{t.notesHistory}</h4>
          {currentJob.notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.noNotes}</p>
          ) : (
            <div className="space-y-3">
              {currentJob.notes.map((note: any, index: number) => {
                // Format the timestamp for display
                const date = new Date(note.timestamp);
                const formattedDate = `${date.toLocaleDateString(
                    language === 'en' ? 'en-US' : 
                    language === 'ko' ? 'ko-KR' : 
                    'ru-RU'
                )} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                
                // Display note in the current language if available
                const displayText = note.originalTexts && note.originalTexts[language as keyof typeof notesTranslations] 
                  ? note.originalTexts[language as keyof typeof notesTranslations] 
                  : note.text;
                
                return (
                  <div key={index} className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between">
                      <p className="text-sm">{displayText}</p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 h-6 w-6 p-0"
                        onClick={() => setNoteToDelete({ index, text: displayText })}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t.deleteNote}</span>
                      </Button>
                    </div>
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
        <h3 className="text-lg font-medium mb-4">{t.updateJobStatus}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={currentJob.status === "pending" ? "default" : "outline"}
            onClick={() => handleStatusChange("pending")}
            className="justify-start"
            disabled={currentJob.status === "completed"}
          >
            {t.pending}
          </Button>
          <Button
            variant={currentJob.status === "in-progress" ? "default" : "outline"}
            onClick={() => handleStatusChange("in-progress")}
            className="justify-start"
            disabled={currentJob.status === "completed"}
          >
            {t.inProgress}
          </Button>
          <Button
            variant={currentJob.status === "on-hold" ? "default" : "outline"}
            onClick={() => handleStatusChange("on-hold")}
            className="justify-start"
            disabled={currentJob.status === "completed"}
          >
            {t.onHold}
          </Button>
          <Button
            variant={currentJob.status === "completed" ? "default" : "outline"}
            onClick={() => handleStatusChange("completed")}
            className="justify-start"
          >
            {t.completed}
          </Button>
        </div>
      </div>

      {/* Delete Note Confirmation Dialog */}
      <AlertDialog open={noteToDelete !== null} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNote}
              className="bg-red-500 hover:bg-red-600"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
