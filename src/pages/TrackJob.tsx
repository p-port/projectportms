
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, Globe, ArrowLeft, ArrowRight, RefreshCw, Image, DollarSign } from "lucide-react";
import { getStatusColor } from "@/components/dashboard/job-details/JobUtils";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

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
    switchLanguage: "Switch language",
    pending: "Your motorcycle is in the queue and waiting to be serviced.",
    inProgress: "Our mechanics are currently working on your motorcycle.",
    onHold: "Work on your motorcycle is temporarily paused. We'll resume shortly.",
    completed_status: "Good news! Your motorcycle service is completed and ready for pickup.",
    retry: "Retry",
    switchToKorean: "Switch to Korean",
    switchToRussian: "Switch to Russian",
    switchToEnglish: "Switch to English",
    initialCost: "Initial Cost",
    finalCost: "Final Cost",
    costEstimate: "Cost Estimate",
    startPhotos: "Initial Service Photos",
    completionPhotos: "Completion Photos",
    noPhotos: "No photos available",
    viewLarger: "View larger"
  },
  ko: {
    title: "프로젝트 포트 - 서비스 상태 추적기",
    jobStatus: "작업 상태",
    loading: "작업 세부 정보 로드 중...",
    errorTitle: "오류",
    errorCheck: "올바른 추적 URL 또는 QR-코드가 있는지 확인하세요.",
    serviceType: "서비스 유형",
    dateCreated: "생성 날짜",
    dateCompleted: "완료 날짜",
    status: "상태",
    progress: "서비스 진행 상황",
    noUpdates: "아직 업데이트가 없습니다",
    completed: "서비스 완료",
    readyPickup: "오토바이를 픽업할 준비가 되었습니다",
    switchLanguage: "언어 전환",
    pending: "오토바이가 대기열에 있으며 서비스를 기다리고 있습니다.",
    inProgress: "우리 정비사들이 현재 귀하의 오토바이를 작업 중입니다.",
    onHold: "오토바이 작업이 일시적으로 중단되었습니다. 곧 재개될 예정입니다.",
    completed_status: "좋은 소식입니다! 오토바이 서비스가 완료되어 픽업할 준비가 되었습니다.",
    retry: "재시도",
    switchToKorean: "한국어로 전환",
    switchToRussian: "러시아어로 전환",
    switchToEnglish: "영어로 전환",
    initialCost: "초기 견적",
    finalCost: "최종 비용",
    costEstimate: "비용 견적",
    startPhotos: "초기 서비스 사진",
    completionPhotos: "완료 사진",
    noPhotos: "사진이 없습니다",
    viewLarger: "크게 보기"
  },
  ru: {
    title: "Проект Порт - Отслеживание статуса услуги",
    jobStatus: "Статус заказа",
    loading: "Загрузка данных заказа...",
    errorTitle: "Ошибка",
    errorCheck: "Пожалуйста, проверьте правильность URL или QR-кода для отслеживания.",
    serviceType: "Тип услуги",
    dateCreated: "Дата создания",
    dateCompleted: "Дата завершения",
    status: "Статус",
    progress: "Ход выполнения услуги",
    noUpdates: "Пока нет обновлений",
    completed: "Услуга выполнена",
    readyPickup: "Ваш мотоцикл готов к выдаче",
    switchLanguage: "Сменить язык",
    pending: "Ваш мотоцикл в очереди и ожидает обслуживания.",
    inProgress: "Наши механики сейчас работают над вашим мотоциклом.",
    onHold: "Работа над вашим мотоциклом временно приостановлена. Мы скоро продолжим.",
    completed_status: "Хорошие новости! Обслуживание вашего мотоцикла завершено, и он готов к выдаче.",
    retry: "Повторить",
    switchToKorean: "Переключиться на корейский",
    switchToRussian: "Переключиться на русский",
    switchToEnglish: "Переключиться на английский",
    initialCost: "Начальная стоимость",
    finalCost: "Итоговая стоимость",
    costEstimate: "Оценка стоимости",
    startPhotos: "Начальные фотографии",
    completionPhotos: "Фотографии завершения",
    noPhotos: "Нет доступных фотографий",
    viewLarger: "Увеличить"
  }
};

// This page would be shown to customers when they scan the QR code
const TrackJob = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useLocalStorage("language", "en");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const t = translations[language as keyof typeof translations];

  const toggleLanguage = () => {
    if (language === "en") setLanguage("ko");
    else if (language === "ko") setLanguage("ru");
    else setLanguage("en");
  };

  const getLanguageButtonText = () => {
    if (language === "en") return t.switchToKorean;
    if (language === "ko") return t.switchToRussian;
    return t.switchToEnglish;
  };

  const loadJobData = async () => {
    if (!jobId) {
      setError("No job ID provided");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Looking up job with ID:", jobId);
      
      // First try to get job from Supabase
      const { data: supabaseJobs, error: supabaseError } = await supabase
        .from('jobs')
        .select('*')
        .eq('job_id', jobId);
      
      if (supabaseError) throw supabaseError;
      
      if (supabaseJobs && supabaseJobs.length > 0) {
        // Format the job from Supabase
        const supabaseJob = supabaseJobs[0];
        console.log("Found job in Supabase:", supabaseJob);
        
        // Extract initialCost and finalCost from the job data
        let initialCost = null;
        let finalCost = null;
        
        // Check if notes contains cost information
        if (supabaseJob.notes && typeof supabaseJob.notes === 'object') {
          if ('initialCost' in supabaseJob.notes) {
            initialCost = supabaseJob.notes.initialCost;
          }
          if ('finalCost' in supabaseJob.notes) {
            finalCost = supabaseJob.notes.finalCost;
          }
        }
        
        const formattedJob = {
          id: supabaseJob.job_id,
          customer: supabaseJob.customer,
          motorcycle: supabaseJob.motorcycle,
          serviceType: supabaseJob.service_type,
          status: supabaseJob.status,
          dateCreated: supabaseJob.date_created ? new Date(supabaseJob.date_created).toISOString().split('T')[0] : null,
          dateCompleted: supabaseJob.date_completed ? new Date(supabaseJob.date_completed).toISOString().split('T')[0] : null,
          notes: supabaseJob.notes || [],
          photos: supabaseJob.photos || { start: [], completion: [] },
          initialCost: initialCost,
          finalCost: finalCost
        };
        
        setJob(formattedJob);
        setError(null);
        return;
      }
      
      // If not found in Supabase, try localStorage
      const storedJobsString = localStorage.getItem('projectPortJobs');
      const jobs = storedJobsString ? JSON.parse(storedJobsString) : [];
      
      console.log("Available jobs in localStorage:", jobs);
      
      // Try to find the job with exact match first
      let foundJob = jobs.find((job: any) => job.id === jobId);
      
      // If not found with exact match, try case-insensitive match
      if (!foundJob) {
        foundJob = jobs.find((job: any) => 
          job.id.toLowerCase() === jobId.toLowerCase()
        );
      }
      
      if (foundJob) {
        console.log("Found job in localStorage:", foundJob);
        setJob(foundJob);
        setError(null);
      } else {
        console.log("Job not found in localStorage or Supabase");
        setError(`No job found with ID: ${jobId}`);
      }
    } catch (err) {
      console.error("Error retrieving job:", err);
      setError("An error occurred while retrieving the job data");
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time updates to the job
  useEffect(() => {
    if (jobId) {
      console.log("Setting up real-time subscription for job ID:", jobId);
      
      // Subscribe to changes on the specific job
      const channel = supabase
        .channel('public:jobs')
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `job_id=eq.${jobId}` },
            (payload) => {
              console.log('Real-time update received:', payload);
              loadJobData(); // Reload the job data when the job is updated
            }
        )
        .subscribe();
        
      return () => {
        // Unsubscribe when component unmounts
        supabase.removeChannel(channel);
        console.log("Removed real-time subscription for job ID:", jobId);
      };
    }
  }, [jobId]);

  useEffect(() => {
    loadJobData();
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

  // Translate notes based on selected language
  const translateNotes = (notes: any[]) => {
    if (!notes) return [];
    
    return notes.map(note => ({
      ...note,
      text: note.originalTexts ? 
        (note.originalTexts[language as keyof typeof translations] || note.text) : 
        note.text
    }));
  };

  const translateStatus = (status: string) => {
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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-center">{t.title}</h1>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <SelectValue placeholder="Select Language" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ko">한국어 (Korean)</SelectItem>
              <SelectItem value="ru">Русский (Russian)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-sm">
            {language === "en" ? (
              <>You can select your preferred language above</>
            ) : language === "ko" ? (
              <>위에서 원하는 언어를 선택할 수 있습니다</>
            ) : (
              <>Вы можете выбрать предпочитаемый язык выше</>
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
                <Button 
                  onClick={loadJobData} 
                  variant="outline"
                  className="mt-4 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t.retry}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && job && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle>Job #{job.id}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {job.motorcycle.make} {job.motorcycle.model} ({job.motorcycle.year})
                  </p>
                </div>
                <Badge className={`${getStatusColor(job.status)} capitalize mt-2 sm:mt-0`}>
                  {job.status === "in-progress" ? t.inProgress : 
                   job.status === "on-hold" ? t.onHold :
                   job.status === "completed" ? t.completed_status :
                   t.pending}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <p>{getStatusMessage(job.status)}</p>
              </div>
              
              <div className="space-y-2">
                <p><span className="font-medium">{t.serviceType}:</span> {job.serviceType}</p>
                <p><span className="font-medium">{t.dateCreated}:</span> {job.dateCreated}</p>
                
                {job.dateCompleted ? (
                  <p><span className="font-medium">{t.dateCompleted}:</span> {job.dateCompleted}</p>
                ) : (
                  <p>
                    <span className="font-medium">{t.status}: </span> 
                    {job.status === "in-progress" ? t.inProgress : 
                     job.status === "on-hold" ? t.onHold :
                     job.status === "completed" ? t.completed_status :
                     t.pending}
                  </p>
                )}
                
                {/* Cost Information */}
                <div className="pt-2">
                  {job.initialCost && (
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t.initialCost}:</span> {job.initialCost}
                    </div>
                  )}
                  
                  {job.finalCost && (
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{t.finalCost}:</span> {job.finalCost}
                    </div>
                  )}
                  
                  {!job.finalCost && job.initialCost && job.status !== "completed" && (
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{t.costEstimate}:</span> {job.initialCost}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Service Photos */}
              {((job.photos?.start && job.photos.start.length > 0) || 
                (job.photos?.completion && job.photos.completion.length > 0)) && (
                <div className="space-y-4">
                  <Separator />
                  
                  {/* Start Photos */}
                  {job.photos?.start && job.photos.start.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        {t.startPhotos}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {job.photos.start.slice(0, 6).map((photo: string, index: number) => (
                          <div 
                            key={`start-${index}`} 
                            className="aspect-square bg-muted rounded-md overflow-hidden relative cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <img 
                              src={photo}
                              alt={`Service start photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {job.photos.start.length > 6 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{job.photos.start.length - 6} more photos
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Completion Photos */}
                  {job.photos?.completion && job.photos.completion.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {t.completionPhotos}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {job.photos.completion.slice(0, 6).map((photo: string, index: number) => (
                          <div 
                            key={`completion-${index}`} 
                            className="aspect-square bg-muted rounded-md overflow-hidden relative cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <img 
                              src={photo}
                              alt={`Service completion photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {job.photos.completion.length > 6 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{job.photos.completion.length - 6} more photos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
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
                    {job.notes && translateNotes(job.notes).map((note: any, index: number) => {
                      const date = new Date(note.timestamp);
                      const formattedDate = `${date.toLocaleDateString(
                        language === 'en' ? 'en-US' : 
                        language === 'ko' ? 'ko-KR' : 
                        'ru-RU'
                      )} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      
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
        
        {/* Photo Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white z-10"
                onClick={() => setSelectedPhoto(null)}
              >
                &times;
              </Button>
              <img 
                src={selectedPhoto} 
                alt="Enlarged service photo"
                className="w-full h-auto max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TrackJob;
