
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DetailsTab } from "./job-details/DetailsTab";
import { NotesTab } from "./job-details/NotesTab";
import { PhotosTab } from "./job-details/PhotosTab";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { getStatusColor, updateJobInLocalStorage, canCompleteJob } from "./job-details/JobUtils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Add translations for JobDetailsDialog
const jobDetailsTranslations = {
  en: {
    manageJob: "Manage job details, photos, and status",
    finalCost: "Final Cost:",
    enterFinalCost: "Enter final cost",
    updateFinalCost: "Update Final Cost",
    details: "Details",
    notesStatus: "Notes & Status",
    photos: "Photos",
    qrCode: "QR Code",
    enterFinalCostTitle: "Enter Final Cost",
    enterFinalCostDescription: "Please enter the final cost for this job before marking it as completed.",
    cancel: "Cancel",
    save: "Save",
    jobStatusUpdated: "Job status updated to",
    failedToUpdate: "Failed to update job status. Please try again.",
    invalidFinalCost: "Please enter a valid final cost",
    finalCostUpdated: "Final cost updated successfully"
  },
  ko: {
    manageJob: "작업 세부정보, 사진 및 상태 관리",
    finalCost: "최종 비용:",
    enterFinalCost: "최종 비용 입력",
    updateFinalCost: "최종 비용 업데이트",
    details: "세부정보",
    notesStatus: "노트 및 상태",
    photos: "사진",
    qrCode: "QR 코드",
    enterFinalCostTitle: "최종 비용 입력",
    enterFinalCostDescription: "작업을 완료로 표시하기 전에 최종 비용을 입력해 주세요.",
    cancel: "취소",
    save: "저장",
    jobStatusUpdated: "작업 상태가 다음으로 업데이트되었습니다",
    failedToUpdate: "작업 상태 업데이트에 실패했습니다. 다시 시도해 주세요.",
    invalidFinalCost: "유효한 최종 비용을 입력해 주세요",
    finalCostUpdated: "최종 비용이 성공적으로 업데이트되었습니다"
  },
  ru: {
    manageJob: "Управление деталями, фотографиями и статусом заказа",
    finalCost: "Итоговая стоимость:",
    enterFinalCost: "Введите итоговую стоимость",
    updateFinalCost: "Обновить итоговую стоимость",
    details: "Детали",
    notesStatus: "Заметки и статус",
    photos: "Фотографии",
    qrCode: "QR-код",
    enterFinalCostTitle: "Введите итоговую стоимость",
    enterFinalCostDescription: "Пожалуйста, введите итоговую стоимость заказа перед тем, как отметить его как завершенный.",
    cancel: "Отмена",
    save: "Сохранить",
    jobStatusUpdated: "Статус заказа обновлен на",
    failedToUpdate: "Не удалось обновить статус заказа. Пожалуйста, попробуйте еще раз.",
    invalidFinalCost: "Пожалуйста, введите действительную итоговую стоимость",
    finalCostUpdated: "Итоговая стоимость успешно обновлена"
  }
};

interface JobDetailsDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateJob: (updatedJob: any) => void;
}

export const JobDetailsDialog = ({
  job,
  open,
  onOpenChange,
  onUpdateJob,
}: JobDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showFinalCostDialog, setShowFinalCostDialog] = useState(false);
  const [finalCost, setFinalCost] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [language] = useLocalStorage("language", "en");
  
  const t = jobDetailsTranslations[language as keyof typeof jobDetailsTranslations];

  // Update currentJob whenever job prop changes
  useEffect(() => {
    if (job) {
      setCurrentJob({ ...job });
      if (job.finalCost) {
        setFinalCost(job.finalCost);
      }
    }
  }, [job]);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };
    
    checkUser();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!currentJob) return;
    
    const minPhotosRequired = 3; // Consistent with PhotosTab
    
    // Check photo requirements
    if (newStatus === "in-progress" && (!currentJob.photos.start || currentJob.photos.start.length < minPhotosRequired)) {
      toast.error(`You need to upload at least ${minPhotosRequired} start photos before changing status to In Progress`);
      return;
    }

    // If trying to complete the job, check completion requirements
    if (newStatus === "completed") {
      const completionCheck = canCompleteJob(currentJob);
      
      if (!completionCheck.valid) {
        toast.error(completionCheck.message);
        
        // If the error is about final cost, prompt for it
        if (completionCheck.message?.includes("final cost")) {
          setPendingStatusChange("completed");
          setShowFinalCostDialog(true);
          return;
        }
        
        return;
      }
    }
    
    const updatedJob = {
      ...currentJob,
      status: newStatus,
    };

    if (newStatus === "completed" && !currentJob.dateCompleted) {
      updatedJob.dateCompleted = new Date().toISOString().split("T")[0];
    }

    try {
      // If user is authenticated, update in Supabase first
      if (user) {
        console.log("Updating job status in Supabase:", updatedJob.id, newStatus);
        
        // Here we need to ensure we're using the correct column names for Supabase
        const { error } = await supabase.from('jobs').update({
          status: newStatus,
          date_completed: updatedJob.dateCompleted
        }).eq('job_id', updatedJob.id);
        
        if (error) {
          console.error("Error updating job status in Supabase:", error);
          throw error;
        }
      }
      
      // Update the job locally
      setCurrentJob(updatedJob);
      onUpdateJob(updatedJob);
      
      // Update the job in localStorage
      updateJobInLocalStorage(updatedJob);
      
      toast.success(`${t.jobStatusUpdated} ${newStatus}`);
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error(t.failedToUpdate);
    }
  };

  const handleFinalCostSubmit = async () => {
    if (!finalCost || isNaN(Number(finalCost))) {
      toast.error(t.invalidFinalCost);
      return;
    }
    
    const updatedJob = {
      ...currentJob,
      finalCost: finalCost
    };
    
    // Update the job with final cost
    setCurrentJob(updatedJob);
    
    try {
      // Update in Supabase if user is authenticated
      if (user) {
        // Store the final cost in the notes object since there's no dedicated column for it
        const notes = updatedJob.notes || {};
        
        const { error } = await supabase.from('jobs').update({
          notes: { ...notes, finalCost: finalCost }
        }).eq('job_id', updatedJob.id);
        
        if (error) {
          console.error("Error updating job final cost in Supabase:", error);
          throw error;
        }
      }
      
      // Update locally
      onUpdateJob(updatedJob);
      updateJobInLocalStorage(updatedJob);
      
      setShowFinalCostDialog(false);
      
      // If this was part of a status change to completed, continue with that change
      if (pendingStatusChange === "completed") {
        setPendingStatusChange(null);
        handleStatusChange("completed");
      } else {
        toast.success(t.finalCostUpdated);
      }
    } catch (error) {
      console.error("Error updating final cost:", error);
      toast.error(t.failedToUpdate);
    }
  };

  // Don't render anything if job is not available
  if (!currentJob) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Job #{currentJob.id} - {currentJob.motorcycle.make}{" "}
                {currentJob.motorcycle.model}
              </span>
              <Badge className={`${getStatusColor(currentJob.status)} capitalize`}>
                {currentJob.status.replace("-", " ")}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {t.manageJob}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="finalCost">{t.finalCost}</Label>
              <div className="relative flex-1">
                <Input
                  id="finalCost"
                  type="text"
                  placeholder={t.enterFinalCost}
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                />
              </div>
              <Button onClick={handleFinalCostSubmit}>
                {t.updateFinalCost}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="details">{t.details}</TabsTrigger>
              <TabsTrigger value="notes">{t.notesStatus}</TabsTrigger>
              <TabsTrigger value="photos">{t.photos}</TabsTrigger>
              <TabsTrigger value="qrcode">{t.qrCode}</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <DetailsTab currentJob={currentJob} />
            </TabsContent>

            <TabsContent value="notes">
              <NotesTab 
                currentJob={currentJob} 
                onUpdateJob={(updatedJob) => {
                  setCurrentJob(updatedJob);
                  onUpdateJob(updatedJob);
                }}
                handleStatusChange={handleStatusChange}
                updateJobInLocalStorage={updateJobInLocalStorage}
              />
            </TabsContent>

            <TabsContent value="photos">
              <PhotosTab 
                currentJob={currentJob} 
                onUpdateJob={(updatedJob) => {
                  setCurrentJob(updatedJob);
                  onUpdateJob(updatedJob);
                }}
                updateJobInLocalStorage={updateJobInLocalStorage}
                minPhotosRequired={3}
              />
            </TabsContent>

            <TabsContent value="qrcode">
              <QrCodeDisplay jobId={currentJob.id} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showFinalCostDialog} onOpenChange={setShowFinalCostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.enterFinalCostTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.enterFinalCostDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder={t.enterFinalCost}
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusChange(null)}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalCostSubmit}>{t.save}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
