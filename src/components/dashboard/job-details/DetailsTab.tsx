
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Define translations for DetailsTab
const detailsTranslations = {
  en: {
    customerInfo: "Customer Information",
    motorcycleInfo: "Motorcycle Information",
    serviceInfo: "Service Information",
    name: "Name:",
    phone: "Phone:",
    email: "Email:",
    make: "Make:",
    model: "Model:",
    year: "Year:",
    vin: "VIN:",
    serviceType: "Service Type:",
    created: "Created:",
    status: "Status:",
    completed: "Completed:",
    notCompleted: "Not completed"
  },
  ko: {
    customerInfo: "고객 정보",
    motorcycleInfo: "오토바이 정보",
    serviceInfo: "서비스 정보",
    name: "이름:",
    phone: "전화번호:",
    email: "이메일:",
    make: "제조사:",
    model: "모델:",
    year: "연식:",
    vin: "차대번호:",
    serviceType: "서비스 유형:",
    created: "생성일:",
    status: "상태:",
    completed: "완료일:",
    notCompleted: "완료되지 않음"
  }
};

interface DetailsTabProps {
  currentJob: any;
}

export const DetailsTab = ({ currentJob }: DetailsTabProps) => {
  const [language] = useLocalStorage("language", "en");
  const t = detailsTranslations[language as keyof typeof detailsTranslations];
  
  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t.customerInfo}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">{t.name}</span>
            <span>{currentJob.customer.name}</span>
            
            <span className="text-muted-foreground">{t.phone}</span>
            <span>{currentJob.customer.phone}</span>
            
            <span className="text-muted-foreground">{t.email}</span>
            <span>{currentJob.customer.email}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t.motorcycleInfo}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">{t.make}</span>
            <span>{currentJob.motorcycle.make}</span>
            
            <span className="text-muted-foreground">{t.model}</span>
            <span>{currentJob.motorcycle.model}</span>
            
            <span className="text-muted-foreground">{t.year}</span>
            <span>{currentJob.motorcycle.year}</span>
            
            <span className="text-muted-foreground">{t.vin}</span>
            <span className="font-mono">{currentJob.motorcycle.vin}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">{t.serviceInfo}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">{t.serviceType}</span>
            <span>{currentJob.serviceType}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">{t.created}</span>
            <span>{currentJob.dateCreated}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">{t.status}</span>
            <span className="capitalize">{currentJob.status.replace("-", " ")}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">{t.completed}</span>
            <span>{currentJob.dateCompleted || t.notCompleted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
