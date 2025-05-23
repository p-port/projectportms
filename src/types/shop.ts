
export interface Shop {
  id: string;
  name: string;
  region: string;
  district: string;
  employee_count: number;
  services: string[];
  unique_identifier: string;
  created_at: string;
  owner_id?: string;
}
