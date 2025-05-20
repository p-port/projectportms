
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { toast } from "sonner";

interface QrCodeDisplayProps {
  jobId: string;
}

export const QrCodeDisplay = ({ jobId }: QrCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);
  
  // In a real app, this would be your actual domain
  const appDomain = window.location.origin;
  const trackingUrl = `${appDomain}/track-job/${jobId}`;
  
  // Generate a simple QR code SVG (in a real app, you'd use a proper QR code library)
  const qrCodeSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect x="0" y="0" width="200" height="200" fill="white"/><rect x="50" y="50" width="20" height="20" fill="black"/><rect x="70" y="50" width="20" height="20" fill="black"/><rect x="90" y="50" width="20" height="20" fill="black"/><rect x="130" y="50" width="20" height="20" fill="black"/><rect x="50" y="70" width="20" height="20" fill="black"/><rect x="110" y="70" width="20" height="20" fill="black"/><rect x="130" y="70" width="20" height="20" fill="black"/><rect x="50" y="90" width="20" height="20" fill="black"/><rect x="70" y="90" width="20" height="20" fill="black"/><rect x="90" y="90" width="20" height="20" fill="black"/><rect x="130" y="90" width="20" height="20" fill="black"/><rect x="50" y="110" width="20" height="20" fill="black"/><rect x="70" y="110" width="20" height="20" fill="black"/><rect x="110" y="110" width="20" height="20" fill="black"/><rect x="50" y="130" width="20" height="20" fill="black"/><rect x="90" y="130" width="20" height="20" fill="black"/><rect x="110" y="130" width="20" height="20" fill="black"/><rect x="130" y="130" width="20" height="20" fill="black"/></svg>`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast.success("Tracking link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Customer Tracking QR Code</h3>
        <p className="text-muted-foreground text-sm">
          Customers can scan this QR code to track the status of their service
        </p>
      </div>

      <Card className="w-full max-w-md p-6 flex flex-col items-center space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <img 
            src={qrCodeSvg} 
            alt="QR Code for job tracking" 
            className="w-48 h-48"
          />
        </div>
        
        <div className="w-full space-y-2">
          <p className="text-sm text-center font-medium">Job Tracking Link</p>
          <div className="flex w-full items-center space-x-2">
            <input
              type="text"
              value={trackingUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
            />
            <Button onClick={handleCopyLink}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <QrCode className="h-4 w-4" />
        <p>
          Print this QR code or share the link with your customer
        </p>
      </div>
    </div>
  );
};
