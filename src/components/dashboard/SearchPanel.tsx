
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, Calendar, Wrench, User, Bike } from "lucide-react";
import { useJobPermissions } from "@/hooks/useJobPermissions";

interface SearchPanelProps {
  jobs: any[];
  userRole?: string;
  userId?: string;
}

export const SearchPanel = ({ jobs, userRole, userId }: SearchPanelProps) => {
  const { permissions, filterJobs } = useJobPermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'customers' | 'motorcycles' | 'jobs'>('customers');

  // Determine what jobs the user can search based on role and shop affiliation
  const getSearchableJobs = () => {
    const userRole = permissions.userRole;
    
    // Admin and support can search all jobs
    if (userRole === 'admin' || userRole === 'support') {
      return jobs;
    }
    
    // Mechanics can only search jobs from their shop
    if (userRole === 'mechanic') {
      if (!permissions.shopId) {
        return []; // No shop affiliation = no job search access
      }
      return jobs.filter(job => job.shop_id === permissions.shopId);
    }
    
    return [];
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs([]);
      return;
    }

    const searchableJobs = getSearchableJobs();
    
    const filtered = searchableJobs.filter(job => {
      const customer = job.customer || {};
      const motorcycle = job.motorcycle || {};
      
      const searchFields = [
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        motorcycle.make || '',
        motorcycle.model || '',
        motorcycle.year?.toString() || '',
        motorcycle.licensePlate || '',
        job.serviceType || '',
        job.service_type || '',
        job.job_id || job.id || ''
      ];

      return searchFields.some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredJobs(filtered);
  }, [searchTerm, jobs, permissions]);

  const getCustomerResults = () => {
    // All users can search customers from any job they have access to
    const searchableJobs = getSearchableJobs();
    
    const customerMap = new Map();
    searchableJobs.forEach(job => {
      const customer = job.customer || {};
      const key = customer.email || customer.name || 'unknown';
      
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customer,
          jobs: [],
          motorcycles: new Set()
        });
      }
      
      customerMap.get(key).jobs.push(job);
      const motorcycle = job.motorcycle || {};
      if (motorcycle.make || motorcycle.model) {
        customerMap.get(key).motorcycles.add(`${motorcycle.make || ''} ${motorcycle.model || ''} (${motorcycle.year || 'N/A'})`);
      }
    });

    return Array.from(customerMap.entries()).map(([key, data]) => ({
      key,
      ...data,
      motorcycles: Array.from(data.motorcycles)
    }));
  };

  const getMotorcycleResults = () => {
    // All users can search motorcycles from any job they have access to
    const searchableJobs = getSearchableJobs();
    
    const motorcycleMap = new Map();
    searchableJobs.forEach(job => {
      const motorcycle = job.motorcycle || {};
      const key = `${motorcycle.make || ''} ${motorcycle.model || ''} ${motorcycle.licensePlate || ''}`.trim();
      
      if (!motorcycleMap.has(key) && key) {
        motorcycleMap.set(key, {
          motorcycle,
          jobs: [],
          customer: job.customer
        });
      }
      
      if (key) {
        motorcycleMap.get(key).jobs.push(job);
      }
    });

    return Array.from(motorcycleMap.entries()).map(([key, data]) => ({
      key,
      ...data
    }));
  };

  const customerResults = getCustomerResults();
  const motorcycleResults = getMotorcycleResults();
  
  // Check if user can search jobs
  const canSearchJobs = () => {
    const userRole = permissions.userRole;
    
    // Admin and support can always search jobs
    if (userRole === 'admin' || userRole === 'support') {
      return true;
    }
    
    // Mechanics can only search jobs if they have shop affiliation
    if (userRole === 'mechanic') {
      return !!permissions.shopId;
    }
    
    return false;
  };

  const jobSearchEnabled = canSearchJobs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="search"
            placeholder="Search customers, motorcycles, or jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm.trim() && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'customers' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <User className="h-4 w-4 inline mr-1" />
                Customers ({customerResults.length})
              </button>
              <button
                onClick={() => setActiveTab('motorcycles')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'motorcycles' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Bike className="h-4 w-4 inline mr-1" />
                Motorcycles ({motorcycleResults.length})
              </button>
              {jobSearchEnabled && (
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'jobs' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Wrench className="h-4 w-4 inline mr-1" />
                  Jobs ({filteredJobs.length})
                </button>
              )}
            </div>
          )}
          
          {searchTerm.trim() && !jobSearchEnabled && permissions.userRole === 'mechanic' && !permissions.shopId && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              Note: Job search is not available as you are not affiliated with a shop.
            </div>
          )}
        </CardContent>
      </Card>

      {searchTerm.trim() && (
        <div className="space-y-4">
          {activeTab === 'customers' && (
            <div className="space-y-4">
              {customerResults.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No customers found matching "{searchTerm}"
                  </CardContent>
                </Card>
              ) : (
                customerResults.map((result) => (
                  <Card key={result.key}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            {result.customer?.name || "Unknown Customer"}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="h-4 w-4" />
                            {result.customer?.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {result.customer?.phone || "N/A"}
                          </div>
                        </div>
                        <Badge variant="secondary">{result.jobs.length} jobs</Badge>
                      </div>
                      {result.motorcycles.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Motorcycles:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.motorcycles.map((motorcycle: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {motorcycle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-sm font-medium">Service History:</p>
                        <div className="space-y-1 mt-1">
                          {result.jobs.slice(0, 3).map((job: any, index: number) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              {job.job_id || job.id} - {job.service_type || job.serviceType} - {new Date(job.date_created || job.dateCreated).toLocaleDateString()}
                            </div>
                          ))}
                          {result.jobs.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              ... and {result.jobs.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'motorcycles' && (
            <div className="space-y-4">
              {motorcycleResults.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No motorcycles found matching "{searchTerm}"
                  </CardContent>
                </Card>
              ) : (
                motorcycleResults.map((result) => (
                  <Card key={result.key}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            {result.motorcycle?.make} {result.motorcycle?.model} ({result.motorcycle?.year})
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            License: {result.motorcycle?.licensePlate || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Current Owner: {result.customer?.name || "Unknown"}
                          </p>
                        </div>
                        <Badge variant="secondary">{result.jobs.length} services</Badge>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium">Service History:</p>
                        <div className="space-y-1 mt-1">
                          {result.jobs.slice(0, 3).map((job: any, index: number) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              {job.job_id || job.id} - {job.service_type || job.serviceType} - {new Date(job.date_created || job.dateCreated).toLocaleDateString()}
                            </div>
                          ))}
                          {result.jobs.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              ... and {result.jobs.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'jobs' && jobSearchEnabled && (
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No jobs found matching "{searchTerm}"
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {new Date(job.date_created || job.dateCreated).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Wrench className="h-4 w-4" />
                            {job.service_type || job.serviceType || "N/A"}
                          </div>
                          <Badge variant="secondary">Job ID: {job.job_id || job.id}</Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium">Motorcycle:</p>
                        <p className="text-sm text-muted-foreground">
                          {job.motorcycle?.make} {job.motorcycle?.model} ({job.motorcycle?.year}) - {job.motorcycle?.licensePlate}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {!searchTerm.trim() && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Enter a search term to find customers, motorcycles, or jobs
          </CardContent>
        </Card>
      )}
    </div>
  );
};
