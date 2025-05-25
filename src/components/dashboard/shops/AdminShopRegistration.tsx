
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";

const KOREAN_REGIONS = [
  "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan",
  "Sejong", "Gyeonggi", "Gangwon", "North Chungcheong", "South Chungcheong",
  "North Jeolla", "South Jeolla", "North Gyeongsang", "South Gyeongsang", "Jeju"
];

const MOTORCYCLE_SERVICES = [
  "Oil Change", "Brake Service", "Tire Replacement", "Chain Maintenance",
  "Engine Repair", "Electrical System", "Suspension Service", "Transmission Service",
  "Cooling System", "Fuel System", "Body Work", "Paint Service",
  "Custom Modifications", "Performance Tuning", "Routine Maintenance", "Emergency Repair"
];

interface ShopFormData {
  name: string;
  business_registration_number: string;
  tax_email: string;
  region: string;
  district: string;
  full_address: string;
  business_phone: string;
  fax_number: string;
  mobile_phone: string;
  employee_count: number;
  services: string[];
  unique_identifier: string;
}

export const AdminShopRegistration = () => {
  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    business_registration_number: "",
    tax_email: "",
    region: "",
    district: "",
    full_address: "",
    business_phone: "",
    fax_number: "",
    mobile_phone: "",
    employee_count: 1,
    services: [],
    unique_identifier: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof ShopFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate unique identifier from shop name
    if (field === 'name' && typeof value === 'string') {
      const identifier = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, unique_identifier: identifier }));
    }
  };

  const handleServiceToggle = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      services: checked 
        ? [...prev.services, service]
        : prev.services.filter(s => s !== service)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.region || !formData.district) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.services.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    try {
      setLoading(true);
      
      // Check if unique identifier already exists
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('unique_identifier', formData.unique_identifier)
        .single();

      if (existingShop) {
        toast.error("A shop with this identifier already exists");
        return;
      }

      const { error } = await supabase
        .from('shops')
        .insert(formData);

      if (error) throw error;

      toast.success("Shop registered successfully");
      
      // Reset form
      setFormData({
        name: "",
        business_registration_number: "",
        tax_email: "",
        region: "",
        district: "",
        full_address: "",
        business_phone: "",
        fax_number: "",
        mobile_phone: "",
        employee_count: 1,
        services: [],
        unique_identifier: ""
      });
    } catch (error) {
      console.error("Error registering shop:", error);
      toast.error("Failed to register shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <CardTitle>Shop Registration</CardTitle>
        </div>
        <CardDescription>
          Register a new motorcycle service shop in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Shop Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter shop name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Unique Identifier *</label>
              <Input
                value={formData.unique_identifier}
                onChange={(e) => handleInputChange('unique_identifier', e.target.value)}
                placeholder="auto-generated"
                required
              />
            </div>
          </div>

          {/* Business Registration */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Registration Number</label>
              <Input
                value={formData.business_registration_number}
                onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
                placeholder="000-00-00000"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Email</label>
              <Input
                type="email"
                value={formData.tax_email}
                onChange={(e) => handleInputChange('tax_email', e.target.value)}
                placeholder="tax@shop.com"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Region *</label>
              <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {KOREAN_REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">District *</label>
              <Input
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                placeholder="Enter district"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Full Address</label>
            <Textarea
              value={formData.full_address}
              onChange={(e) => handleInputChange('full_address', e.target.value)}
              placeholder="Enter complete address"
              rows={2}
            />
          </div>

          {/* Contact Information */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Phone</label>
              <Input
                value={formData.business_phone}
                onChange={(e) => handleInputChange('business_phone', e.target.value)}
                placeholder="02-1234-5678"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile Phone</label>
              <Input
                value={formData.mobile_phone}
                onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                placeholder="010-1234-5678"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Fax Number</label>
              <Input
                value={formData.fax_number}
                onChange={(e) => handleInputChange('fax_number', e.target.value)}
                placeholder="02-1234-5679"
              />
            </div>
          </div>

          {/* Employee Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Employees</label>
            <Input
              type="number"
              min="1"
              value={formData.employee_count}
              onChange={(e) => handleInputChange('employee_count', parseInt(e.target.value) || 1)}
              className="w-32"
            />
          </div>

          {/* Services */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Services Offered *</label>
            <div className="grid gap-3 md:grid-cols-3">
              {MOTORCYCLE_SERVICES.map(service => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={formData.services.includes(service)}
                    onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                  />
                  <label htmlFor={service} className="text-sm font-medium leading-none">
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Registering..." : "Register Shop"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
