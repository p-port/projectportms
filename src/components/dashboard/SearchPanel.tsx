import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, Calendar, Wrench } from "lucide-react";
import { SearchCustomers } from "./SearchCustomers";
import { useJobPermissions } from "@/hooks/useJobPermissions";

interface SearchPanelProps {
  jobs: any[];
  userRole?: string;
  userId?: string;
}

export const SearchPanel = ({ jobs, userRole, userId }: SearchPanelProps) => {
  const { filterJobs } = useJobPermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);

  // Apply permission filtering to jobs
  const permissionFilteredJobs = filterJobs(jobs);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs([]);
      return;
    }

    const filtered = permissionFilteredJobs.filter(job => {
      const customer = job.customer || {};
      const motorcycle = job.motorcycle || {};
      
      const searchFields = [
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        motorcycle.make || '',
        motorcycle.model || '',
        motorcycle.year || '',
        motorcycle.licensePlate || '',
        job.serviceType || '',
        job.id || ''
      ];

      return searchFields.some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredJobs(filtered);
  }, [searchTerm, permissionFilteredJobs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Customer Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="search"
          placeholder="Search customers, motorcycles, or jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm.trim() && filteredJobs.length === 0 && (
          <div className="text-muted-foreground">
            No matching records found.
          </div>
        )}

        {filteredJobs.length > 0 && (
          <div className="space-y-2">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="border">
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">
                      {job.customer?.name || "Unknown Customer"}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {job.customer?.phone || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {job.customer?.email || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(job.dateCreated).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wrench className="h-4 w-4" />
                      {job.serviceType || "N/A"}
                    </div>
                    <Badge variant="secondary">Job ID: {job.id}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
