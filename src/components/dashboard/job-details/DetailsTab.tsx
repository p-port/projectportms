
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define translations for DetailsTab
const detailsTranslations = {
  en: {
    customerInfo: "Customer Information",
    motorcycleInfo: "Motorcycle Information",
    serviceInfo: "Service Information",
    shopInfo: "Shop Information",
    name: "Name:",
    phone: "Phone:",
    email: "Email:",
    make: "Make:",
    model: "Model:",
    year: "Year:",
    vin: "VIN:",
    englishName: "English Name:",
    koreanName: "Korean Name:",
    mileage: "Mileage:",
    plateNumber: "Plate Number:",
    serviceType: "Service Type:",
    created: "Created:",
    status: "Status:",
    completed: "Completed:",
    initialCost: "Initial Cost:",
    finalCost: "Final Cost:",
    notCompleted: "Not completed",
    pending: "Pending",
    inProgress: "In Progress",
    onHold: "On Hold",
    completed_status: "Completed",
    shopName: "Shop Name:",
    shopLocation: "Location:",
    noShopInfo: "No shop information available"
  },
  ko: {
    customerInfo: "고객 정보",
    motorcycleInfo: "오토바이 정보",
    serviceInfo: "서비스 정보",
    shopInfo: "샵 정보",
    name: "이름:",
    phone: "전화번호:",
    email: "이메일:",
    make: "제조사:",
    model: "모델:",
    year: "연식:",
    vin: "차대번호:",
    englishName: "영문 이름:",
    koreanName: "한글 이름:",
    mileage: "주행거리:",
    plateNumber: "번호판:",
    serviceType: "서비스 유형:",
    created: "생성일:",
    status: "상태:",
    completed: "완료일:",
    initialCost: "초기 견적:",
    finalCost: "최종 비용:",
    notCompleted: "완료되지 않음",
    pending: "대기 중",
    inProgress: "진행 중",
    onHold: "보류 중",
    completed_status: "완료됨",
    shopName: "샵 이름:",
    shopLocation: "위치:",
    noShopInfo: "샵 정보가 없습니다"
  },
  ru: {
    customerInfo: "Информация о клиенте",
    motorcycleInfo: "Информация о мотоцикле",
    serviceInfo: "Информация об услуге",
    shopInfo: "Информация о магазине",
    name: "Имя:",
    phone: "Телефон:",
    email: "Эл. почта:",
    make: "Марка:",
    model: "Модель:",
    year: "Год:",
    vin: "VIN:",
    englishName: "Английское имя:",
    koreanName: "Корейское имя:",
    mileage: "Пробег:",
    plateNumber: "Номерной знак:",
    serviceType: "Тип услуги:",
    created: "Создано:",
    status: "Статус:",
    completed: "Завершено:",
    initialCost: "Начальная стоимость:",
    finalCost: "Итоговая стоимость:",
    notCompleted: "Не завершено",
    pending: "В ожидании",
    inProgress: "В процессе",
    onHold: "На удержании",
    completed_status: "Завершено",
    shopName: "Название магазина:",
    shopLocation: "Местоположение:",
    noShopInfo: "Информация о магазине недоступна"
  }
};

interface DetailsTabProps {
  currentJob: any;
}

export const DetailsTab = ({ currentJob }: DetailsTabProps) => {
  const [language] = useLocalStorage("language", "en");
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [loadingShop, setLoadingShop] = useState(false);
  const t = detailsTranslations[language as keyof typeof detailsTranslations];
  
  useEffect(() => {
    const fetchShopInfo = async () => {
      if (!currentJob?.shop_id) return;
      
      setLoadingShop(true);
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('name, region, district')
          .eq('id', currentJob.shop_id)
          .single();

        if (!error && data) {
          setShopInfo(data);
        }
      } catch (error) {
        console.error('Error fetching shop info:', error);
      } finally {
        setLoadingShop(false);
      }
    };

    fetchShopInfo();
  }, [currentJob?.shop_id]);
  
  const translateStatus = (status: string) => {
    // Convert kebab-case to camelCase for lookup in translations
    const statusKey = status.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof t;
    return t[statusKey] || status.replace("-", " ");
  };
  
  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t.customerInfo}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {currentJob.customer.englishName && (
              <>
                <span className="text-muted-foreground">{t.englishName}</span>
                <span>{currentJob.customer.englishName}</span>
              </>
            )}
            
            {currentJob.customer.koreanName && (
              <>
                <span className="text-muted-foreground">{t.koreanName}</span>
                <span>{currentJob.customer.koreanName}</span>
              </>
            )}
            
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
            
            {currentJob.motorcycle.mileage && (
              <>
                <span className="text-muted-foreground">{t.mileage}</span>
                <span>{currentJob.motorcycle.mileage}</span>
              </>
            )}
            
            {currentJob.motorcycle.plateNumber && (
              <>
                <span className="text-muted-foreground">{t.plateNumber}</span>
                <span>{currentJob.motorcycle.plateNumber}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shop Information Section */}
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">{t.shopInfo}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {loadingShop ? (
            <span className="col-span-2">Loading shop information...</span>
          ) : shopInfo ? (
            <>
              <span className="text-muted-foreground">{t.shopName}</span>
              <span>{shopInfo.name}</span>
              
              <span className="text-muted-foreground">{t.shopLocation}</span>
              <span>{shopInfo.region}, {shopInfo.district}</span>
            </>
          ) : (
            <span className="col-span-2 text-muted-foreground">{t.noShopInfo}</span>
          )}
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
            <span className="capitalize">{translateStatus(currentJob.status)}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">{t.completed}</span>
            <span>{currentJob.dateCompleted || t.notCompleted}</span>
          </div>

          {currentJob.initialCost && (
            <div>
              <span className="text-muted-foreground block">{t.initialCost}</span>
              <span>{currentJob.initialCost}</span>
            </div>
          )}
          
          {currentJob.finalCost && (
            <div>
              <span className="text-muted-foreground block">{t.finalCost}</span>
              <span>{currentJob.finalCost}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
