
import { Input } from "@/components/ui/input";
import { Shop } from "@/types/shop";

interface ShopContactInfoProps {
  shop: Shop;
  editing: boolean;
  editForm: Shop;
  onInputChange: (field: keyof Shop, value: any) => void;
}

export const ShopContactInfo = ({ shop, editing, editForm, onInputChange }: ShopContactInfoProps) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Contact Information</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Business Phone</label>
          {editing ? (
            <Input
              value={editForm.business_phone || ''}
              onChange={(e) => onInputChange('business_phone', e.target.value)}
            />
          ) : (
            <p className="text-sm mt-1">{shop.business_phone || 'Not provided'}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Mobile Phone</label>
          {editing ? (
            <Input
              value={editForm.mobile_phone || ''}
              onChange={(e) => onInputChange('mobile_phone', e.target.value)}
            />
          ) : (
            <p className="text-sm mt-1">{shop.mobile_phone || 'Not provided'}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Fax Number</label>
          {editing ? (
            <Input
              value={editForm.fax_number || ''}
              onChange={(e) => onInputChange('fax_number', e.target.value)}
            />
          ) : (
            <p className="text-sm mt-1">{shop.fax_number || 'Not provided'}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Tax Email</label>
          {editing ? (
            <Input
              type="email"
              value={editForm.tax_email || ''}
              onChange={(e) => onInputChange('tax_email', e.target.value)}
            />
          ) : (
            <p className="text-sm mt-1">{shop.tax_email || 'Not provided'}</p>
          )}
        </div>
      </div>
    </div>
  );
};
