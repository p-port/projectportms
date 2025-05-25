
import { Input } from "@/components/ui/input";
import { Users, AlertTriangle } from "lucide-react";
import { Shop } from "@/types/shop";

interface ShopBasicInfoProps {
  shop: Shop;
  editing: boolean;
  editForm: Shop;
  onInputChange: (field: keyof Shop, value: any) => void;
}

export const ShopBasicInfo = ({ shop, editing, editForm, onInputChange }: ShopBasicInfoProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium">Employee Count</label>
        {editing ? (
          <div className="space-y-1">
            <Input
              type="number"
              value={editForm.employee_count || ''}
              onChange={(e) => onInputChange('employee_count', parseInt(e.target.value) || 0)}
              disabled={true}
            />
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              Requires admin approval
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <Users className="h-4 w-4" />
            {shop.employee_count} employees
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Shop ID</label>
        <div className="text-xs text-muted-foreground mt-1">
          {shop.unique_identifier}
        </div>
      </div>
    </div>
  );
};
