
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { Shop } from "@/types/shop";

interface ShopBusinessInfoProps {
  shop: Shop;
  editing: boolean;
  editForm: Shop;
  onInputChange: (field: keyof Shop, value: any) => void;
}

export const ShopBusinessInfo = ({ shop, editing, editForm, onInputChange }: ShopBusinessInfoProps) => {
  return (
    <div>
      <label className="text-sm font-medium">Business Registration Number</label>
      {editing ? (
        <div className="space-y-1">
          <Input
            value={editForm.business_registration_number || ''}
            onChange={(e) => onInputChange('business_registration_number', e.target.value)}
            disabled={true}
          />
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            Requires admin approval to change
          </div>
        </div>
      ) : (
        <p className="text-sm mt-1">{shop.business_registration_number || 'Not provided'}</p>
      )}
    </div>
  );
};
