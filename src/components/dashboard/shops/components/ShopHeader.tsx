
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Edit, Save, X, AlertTriangle, Home } from "lucide-react";
import { Shop } from "@/types/shop";

interface ShopHeaderProps {
  shop: Shop;
  editing: boolean;
  editForm: Partial<Shop>;
  canEdit: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: <K extends keyof Shop>(field: K, value: Shop[K]) => void;
  onNavigateHome: () => void;
}

export const ShopHeader = ({
  shop,
  editing,
  editForm,
  canEdit,
  onEdit,
  onSave,
  onCancel,
  onInputChange,
  onNavigateHome
}: ShopHeaderProps) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        {shop.logo_url && (
          <img 
            src={shop.logo_url} 
            alt={`${shop.name} logo`}
            className="w-16 h-16 object-cover rounded border"
          />
        )}
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {editing ? (
              <div className="space-y-1">
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => onInputChange('name', e.target.value)}
                  className="text-lg font-semibold"
                  disabled={true}
                />
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  Requires admin approval to change
                </div>
              </div>
            ) : (
              shop.name
            )}
          </CardTitle>
          <CardDescription className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {editing ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Region"
                  value={editForm.region || ''}
                  onChange={(e) => onInputChange('region', e.target.value)}
                  className="w-32"
                  disabled={true}
                />
                <Input
                  placeholder="District"
                  value={editForm.district || ''}
                  onChange={(e) => onInputChange('district', e.target.value)}
                  className="w-32"
                  disabled={true}
                />
              </div>
            ) : (
              `${shop.region}, ${shop.district}`
            )}
          </CardDescription>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onNavigateHome}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
        {canEdit && (
          <>
            {editing ? (
              <>
                <Button size="sm" onClick={onSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
