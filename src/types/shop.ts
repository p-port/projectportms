
export interface Shop {
  id: string;
  name: string;
  unique_identifier: string;
  region: string;
  district: string;
  services: string[];
  employee_count: number;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  business_registration_number?: string;
  tax_email?: string;
  full_address?: string;
  business_phone?: string;
  fax_number?: string;
  mobile_phone?: string;
  logo_url?: string;
}
