
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { Shop } from "@/types/shop";

interface ShopAddressInfoProps {
  shop: Shop;
  editing: boolean;
  editForm: Partial<Shop>;
  onInputChange: <K extends keyof Shop>(field: K, value: Shop[K]) => void;
}

export const ShopAddressInfo = ({ shop, editing, editForm, onInputChange }: ShopAddressInfoProps) => {
  return (
    <div>
      <label className="text-sm font-medium">Full Address</label>
      {editing ? (
        <div className="space-y-1">
          <Textarea
            value={editForm.full_address || ''}
            onChange={(e) => onInputChange('full_address', e.target.value)}
            rows={3}
            disabled={true}
          />
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            Requires admin approval to change
          </div>
        </div>
      ) : (
        <p className="text-sm mt-1">{shop.full_address || 'Not provided'}</p>
      )}
    </div>
  );
};
