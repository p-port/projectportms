
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface QrCodeDisplayProps {
  jobId: string;
}

// Define translations for QR code display component
const qrCodeTranslations = {
  en: {
    title: "Customer Tracking QR Code",
    description: "Customers can scan this QR code to track the status of their service",
    trackingLink: "Job Tracking Link",
    copyButton: "Copy",
    copied: "Copied!",
    copySuccess: "Tracking link copied to clipboard",
    printOrShare: "Print this QR code or share the link with your customer"
  },
  ko: {
    title: "고객 추적 QR 코드",
    description: "고객이 이 QR 코드를 스캔하여 서비스 상태를 추적할 수 있습니다",
    trackingLink: "작업 추적 링크",
    copyButton: "복사",
    copied: "복사됨!",
    copySuccess: "추적 링크가 클립보드에 복사되었습니다",
    printOrShare: "이 QR 코드를 인쇄하거나 고객과 링크를 공유하세요"
  },
  ru: {
    title: "QR-код отслеживания для клиента",
    description: "Клиенты могут отсканировать этот QR-код для отслеживания статуса своего обслуживания",
    trackingLink: "Ссылка для отслеживания заказа",
    copyButton: "Копировать",
    copied: "Скопировано!",
    copySuccess: "Ссылка для отслеживания скопирована в буфер обмена",
    printOrShare: "Распечатайте этот QR-код или поделитесь ссылкой с клиентом"
  }
};

export const QrCodeDisplay = ({ jobId }: QrCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [language] = useLocalStorage("language", "en");
  
  // Get translations based on selected language
  const t = qrCodeTranslations[language as keyof typeof qrCodeTranslations];
  
  // In a real app, this would be your actual domain
  const appDomain = window.location.origin;
  // The tracking URL needs to include the full jobId
  const trackingUrl = `${appDomain}/track-job/${jobId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast.success(t.copySuccess);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">{t.title}</h3>
        <p className="text-muted-foreground text-sm">
          {t.description}
        </p>
      </div>

      <Card className="w-full max-w-md p-6 flex flex-col items-center space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <QRCode
            value={trackingUrl}
            size={192}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </div>
        
        <div className="w-full space-y-2">
          <p className="text-sm text-center font-medium">{t.trackingLink}</p>
          <div className="flex w-full items-center space-x-2">
            <input
              type="text"
              value={trackingUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
            />
            <Button onClick={handleCopyLink}>
              {copied ? t.copied : t.copyButton}
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <QrCode className="h-4 w-4" />
        <p>
          {t.printOrShare}
        </p>
      </div>
    </div>
  );
};
