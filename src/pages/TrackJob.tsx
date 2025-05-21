
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, Globe, ArrowLeft, ArrowRight } from "lucide-react";
import { getStatusColor } from "@/components/dashboard/job-details/JobUtils";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Define languages for translation
const translations = {
  en: {
    title: "Project Port - Service Status Tracker",
    jobStatus: "Job Status",
    loading: "Loading job details...",
    errorTitle: "Error",
    errorCheck: "Please check that you have the correct tracking URL or QR code.",
    serviceType: "Service type",
    dateCreated: "Date created",
    dateCompleted: "Date completed",
    status: "Status",
    progress: "Service Progress",
    noUpdates: "No updates yet",
    completed: "Service completed",
    readyPickup: "Your motorcycle is ready for pickup",
    switchLanguage: "Switch to Korean",
    pending: "Your motorcycle is in the queue and waiting to be serviced.",
    inProgress: "Our mechanics are currently working on your motorcycle.",
    onHold: "Work on your motorcycle is temporarily paused. We'll resume shortly.",
    completed_status: "Good news! Your motorcycle service is completed and ready for pickup."
  },
  ko: {
    title: "프로젝트 포트 - 서비스 상태 추적기",
    jobStatus: "작업 상태",
    loading: "작업 세부 정보 로드 중...",
    errorTitle: "오류",
    errorCheck: "올바른 추적 URL 또는 QR 코드가 있는지 확인하세요.",
    serviceType: "서비스 유형",
    dateCreated: "생성 날짜",
    dateCompleted: "완료 날짜",
    status: "상태",
    progress: "서비스 진행 상황",
    noUpdates: "아직 업데이트가 없습니다",
    completed: "서비스 완료",
    readyPickup: "오토바이를 픽업할 준비가 되었습니다",
    switchLanguage: "영어로 전환",
    pending: "오토바이가 대기열에 있으며 서비스를 기다리고 있습니다.",
    inProgress: "우리 정비사들이 현재 귀하의 오토바이를 작업 중입니다.",
    onHold: "오토바이 작업이 일시적으로 중단되었습니다. 곧 재개될 예정입니다.",
    completed_status: "좋은 소식입니다! 오토바이 서비스가 완료되어 픽업할 준비가 되었습니다."
  }
};

// Create a custom hook for language preference
const useLanguage = () => {
  const [language, setLanguage] = useLocalStorage("language", "en");
  
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ko" : "en");
  };
  
  return {
    language,
    t: translations[language as keyof typeof translations],
    toggleLanguage
  };
};

// This page would be shown to customers when they scan the QR code
const TrackJob = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, t, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would fetch from your API
    // For demo, we'll retrieve job data from localStorage
    setLoading(true);
    
    try {
      // Get all jobs from localStorage
      const storedJobsString = localStorage.getItem('projectPortJobs');
      const jobs = storedJobsString ? JSON.parse(storedJobsString) : [];
      
      console.log("Looking for job with ID:", jobId);
      console.log("Available jobs:", jobs);
      
      // Find the job with the matching ID - use case-insensitive matching and check for encoded URLs
      const decodedJobId = decodeURIComponent(jobId || "");
      const foundJob = jobs.find((job: any) => 
        job.id === jobId || 
        job.id === decodedJobId ||
        job.id.toLowerCase() === decodedJobId.toLowerCase()
      );
      
      if (foundJob) {
        console.log("Found job:", foundJob);
        setJob(foundJob);
        setError(null);
      } else {
        console.log("Job not found");
        setError(`No job found with ID: ${jobId}`);
      }
    } catch (err) {
      console.error("Error retrieving job:", err);
      setError("An error occurred while retrieving the job data");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return t.pending;
      case "in-progress":
        return t.inProgress;
      case "on-hold":
        return t.onHold;
      case "completed":
        return t.completed_status;
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-center">{t.title}</h1>
          <Button 
            onClick={toggleLanguage}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {language === "en" ? t.switchLanguage : t.switchLanguage}
            {language === "en" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            {language === "en" ? (
              <>You can switch to Korean using the button above</>
            ) : (
              <>위의 버튼을 사용하여 영어로 전환할 수 있습니다</>
            )}
          </p>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-60">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">{t.loading}</p>
            </div>
          </div>
        )}

        {error && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center p-6">
                <h3 className="text-lg font-medium text-red-600">{t.errorTitle}</h3>
                <p className="mt-2">{error}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t.errorCheck}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && job && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Job #{job.id}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {job.motorcycle.make} {job.motorcycle.model} ({job.motorcycle.year})
                  </p>
                </div>
                <Badge className={`${getStatusColor(job.status)} capitalize`}>
                  {job.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p>{getStatusMessage(job.status)}</p>
              </div>
              
              <div className="space-y-2">
                <p><span className="font-medium">{t.serviceType}:</span> {job.serviceType}</p>
                <p><span className="font-medium">{t.dateCreated}:</span> {job.dateCreated}</p>
                
                {job.dateCompleted ? (
                  <p><span className="font-medium">{t.dateCompleted}:</span> {job.dateCompleted}</p>
                ) : (
                  <p><span className="font-medium">{t.status}:</span> {job.status.replace("-", " ")}</p>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t.progress}
                </h3>
                
                {job.notes && job.notes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t.noUpdates}</p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:top-3 before:bottom-0 before:left-1.5 before:w-px before:bg-muted-foreground/20">
                    {job.notes && job.notes.map((note: any, index: number) => {
                      const date = new Date(note.timestamp);
                      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      
                      return (
                        <div key={index} className="pl-6 relative">
                          <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background"></div>
                          <p className="font-medium">{note.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formattedDate}
                          </p>
                        </div>
                      );
                    })}
                    
                    {job.status === "completed" && (
                      <div className="pl-6 relative">
                        <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-green-500 ring-4 ring-background">
                          <Check className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
                        </div>
                        <p className="font-medium">{t.completed}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.readyPickup}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TrackJob;
