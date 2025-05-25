
import { AlertTriangle } from "lucide-react";

interface AdminApprovalNoticeProps {
  isShopOwner: boolean;
}

export const AdminApprovalNotice = ({ isShopOwner }: AdminApprovalNoticeProps) => {
  if (!isShopOwner) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-orange-800">Admin Approval Required</p>
          <p className="text-orange-700 mt-1">
            To change shop name, region, district, address, employee count, or business registration number, 
            please create a support ticket for administrator approval.
          </p>
        </div>
      </div>
    </div>
  );
};
