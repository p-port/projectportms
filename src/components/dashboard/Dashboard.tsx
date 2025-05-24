// src/components/dashboard/Dashboard.tsx
import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { generateUniqueJobId } from "./job-details/JobUtils";
import { DashboardHeader } from "./features/DashboardHeader";
import { TabsNavigation } from "./features/TabsNavigation";
import { TabContent } from "./features/TabContent";
import {
  fetchUnreadTicketsCount,
  subscribeToTicketUpdates,
} from "./services/UnreadTicketsService";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

// -- TYPES ------------------------------------------------------------------

type Language = "en" | "ko" | "ru";

interface Customer {
  name: string;
  email: string;
  phone: string;
}

interface Motorcycle {
  make: string;
  model: string;
  year: string;
  vin?: string;
  mileage?: string;
  plateNumber?: string;
}

interface Job {
  id: string;
  customer: Customer;
  motorcycle: Motorcycle;
  serviceType: string;
  status: "pending" | "in-progress" | "completed" | string;
  dateCreated: string;
  dateCompleted: string | null;
  notes: any; // refine as needed
  photos: { start: string[]; completion: string[] };
  shopId?: string | null;
}

interface DashboardProps {
  user: User | null;
}

// -- TRANSLATIONS -----------------------------------------------------------

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    welcome: "Welcome back",
    searchPlaceholder: "Search jobs by ID, customer name, or motorcycle...",
    activeJobs: "Active Jobs",
    completed: "Completed",
    newJob: "New Job",
    search: "Search",
    support: "Support",
    tickets: "Tickets",
    account: "Account",
    shops: "Shops",
    users: "Users",
    loading: "Loading jobs...",
    error: "Error loading jobs",
    retry: "Retry",
    noActiveJobs: "No active jobs found",
    createNewJob: "Create a new job to get started",
    noCompletedJobs: "No completed jobs found",
    completedJobsAppear: "Completed jobs will appear here",
    jobSynced: "Job synced to cloud storage",
    jobSyncError: "Failed to sync job to cloud",
  },
  ko: {
    dashboard: "대시보드",
    welcome: "다시 환영합니다",
    searchPlaceholder: "작업 ID, 고객 이름 또는 오토바이로 검색...",
    activeJobs: "활성 작업",
    completed: "완료됨",
    newJob: "새 작업",
    search: "검색",
    support: "지원",
    tickets: "티켓",
    account: "계정",
    shops: "샵",
    users: "사용자",
    loading: "작업 로딩 중...",
    error: "작업을 불러오는 중 오류가 발생했습니다",
    retry: "재시도",
    noActiveJobs: "활성 작업을 찾을 수 없습니다",
    createNewJob: "시작하려면 새 작업을 생성하세요",
    noCompletedJobs: "완료된 작업을 찾을 수 없습니다",
    completedJobsAppear: "완료된 작업이 여기에 표시됩니다",
    jobSynced: "작업이 클라우드 스토리지에 동기화되었습니다",
    jobSyncError: "작업을 클라우드에 동기화하지 못했습니다",
  },
  ru: {
    dashboard: "Панель управления",
    welcome: "С возвращением",
    searchPlaceholder: "Поиск заказов по ID, имени клиента или мотоциклу...",
    activeJobs: "Активные заказы",
    completed: "Завершенные",
    newJob: "Новый заказ",
    search: "Поиск",
    support: "Поддержка",
    tickets: "Тикеты",
    account: "Аккаунт",
    shops: "Магазины",
    users: "Пользователи",
    loading: "Загрузка заказов...",
    error: "Ошибка при загрузке заказов",
    retry: "Повторить",
    noActiveJobs: "Активных заказов не найдено",
    createNewJob: "Создайте новый заказ, чтобы начать",
    noCompletedJobs: "Завершенных заказов не найдено",
    completedJobsAppear: "Завершенные заказы будут отображаться здесь",
    jobSynced: "Заказ синхронизирован с облачным хранилищем",
    jobSyncError: "Не удалось синхронизировать заказ с облаком",
  },
};

export const Dashboard = ({ user }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<"active-jobs" | "completed">(
    "active-jobs"
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const [language] = useState<Language>(
    (localStorage.getItem("language") as Language) || "en"
  );
  const t = translations[language];
  const [userRole, setUserRole] = useState<string>("mechanic");

  const [unreadTickets, setUnreadTickets] = useState<number>(0);

  // — fetch user role —
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select<{ role: string }>("role")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setUserRole(data.role);
      });
  }, [user?.id]);

  // — unread tickets + subscription —
  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadTicketsCount(user.id, userRole).then(setUnreadTickets);

    const channel = subscribeToTicketUpdates(
      user.id,
      userRole,
      () => setUnreadTickets((c) => c + 1),
      () => setUnreadTickets((c) => Math.max(0, c - 1))
    );
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, userRole]);

  // — load jobs —
  useEffect(() => {
    setLoading(true);
    setError(false);

    const load = async () => {
      try {
        if (user?.id) {
          const { data: raw, error: supaErr } = await supabase
            .from("jobs")
            .select("*")
            .order("date_created", { ascending: false });
          if (supaErr) throw supaErr;
          if (raw && raw.length) {
            const formatted: Job[] = raw.map((job) => ({
              id: job.job_id,
              customer: job.customer,
              motorcycle: job.motorcycle,
              serviceType: job.service_type,
              status: job.status,
              dateCreated: job.date_created
                ? new Date(job.date_created).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              dateCompleted: job.date_completed
                ? new Date(job.date_completed).toISOString().split("T")[0]
                : null,
              notes: job.notes ?? [],
              photos: job.photos ?? { start: [], completion: [] },
              shopId: (job as any).shop_id ?? null,
            }));
            setJobs(formatted);
            localStorage.setItem("projectPortJobs", JSON.stringify(formatted));
            return;
          }
        }

        // fallback localStorage
        const stored = localStorage.getItem("projectPortJobs");
        if (stored) {
          const arr: Job[] = JSON.parse(stored);
          setJobs(arr);
        } else {
          setJobs([]);
          localStorage.setItem("projectPortJobs", "[]");
        }
      } catch {
        setError(true);
        const stored = localStorage.getItem("projectPortJobs");
        setJobs(stored ? JSON.parse(stored) : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  // — sync helper —
  const syncJobsToSupabase = async (jobsToSync: Job[], userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      const shopId = (profile as any)?.shop_id ?? null;
      for (const j of jobsToSync) {
        await supabase.from("jobs").upsert({
          job_id: j.id,
          customer: j.customer,
          motorcycle: j.motorcycle,
          service_type: j.serviceType,
          status: j.status,
          date_created: j.dateCreated,
          date_completed: j.dateCompleted,
          notes: j.notes,
          photos: j.photos,
          user_id: userId,
          shop_id: shopId,
        });
      }
      toast.success(t.jobSynced);
    } catch {
      toast.error(t.jobSyncError);
    }
  };

  const handleAddJob = (jobData: Omit<Job, "id" | "status" | "dateCreated" | "dateCompleted" | "notes" | "photos">) => {
    const newId = generateUniqueJobId(jobData.motorcycle.make, jobData.motorcycle.model, jobs.length + 1);
    const newJob: Job = {
      ...jobData,
      id: newId,
      status: "pending",
      dateCreated: new Date().toISOString().split("T")[0],
      dateCompleted: null,
      notes: [],
      photos: { start: [], completion: [] },
    };
    const updated = [newJob, ...jobs];
    setJobs(updated);
    localStorage.setItem("projectPortJobs", JSON.stringify(updated));
    if (user?.id) syncJobsToSupabase(updated, user.id);
    setActiveTab("active-jobs");
  };

  const filtered = searchQuery
    ? jobs.filter(
        (j) =>
          j.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.motorcycle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.motorcycle.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  const activeJobs = filtered.filter((j) => j.status !== "completed");
  const completedJobs = filtered.filter((j) => j.status === "completed");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center space-y-4">
          <p className="text-destructive">{t.error}</p>
          <Button onClick={() => window.location.reload()}>{t.retry}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={user?.email}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        translations={t}
        userId={user?.id}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          activeJobs={activeJobs.length}
          completedJobs={completedJobs.length}
          unreadTickets={unreadTickets}
          translations={t}
          userRole={userRole}
          userId={user?.id}
        />

        <TabContent
          activeJobs={activeJobs}
          completedJobs={completedJobs}
          allJobs={jobs}
          setJobs={setJobs}
          handleAddJob={handleAddJob}
          userId={user?.id}
          userRole={userRole}
          translations={t}
        />
      </Tabs>
    </div>
  );
};
