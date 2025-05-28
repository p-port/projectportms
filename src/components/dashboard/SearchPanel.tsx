import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Phone, Mail, Calendar, Wrench, User, Bike } from "lucide-react";
import { useJobPermissions } from "@/hooks/useJobPermissions";

interface SearchPanelProps {
  jobs: any[];
  userRole?: string;
  userId?: string;
}

export const SearchPanel = ({ jobs, userRole, userId }: SearchPanelProps) => {
  const { permissions } = useJobPermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'customers' | 'motorcycles' | 'jobs'>('customers');

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs([]);
      return;
    }

    const filtered = jobs.filter(job => {
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
        motorcycle.vin || '',
        job.serviceType || '',
        job.service_type || '',
        job.job_id || job.id || ''
      ];

      return searchFields.some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredJobs(filtered);
  }, [searchTerm, jobs]);

  const getCustomerResults = () => {
    if (!searchTerm.trim()) return [];
    
    const customerMap = new Map();
    // Now search ALL jobs, not just filtered ones for mechanics
    jobs.forEach(job => {
      const customer = job.customer || {};
      const searchFields = [
        customer.name || '',
        customer.email || '',
        customer.phone || ''
      ];
      
      const matchesSearch = searchFields.some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!matchesSearch) return;
      
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
        customerMap.get(key).motorcycles.add({
          display: `${motorcycle.make || ''} ${motorcycle.model || ''} (${motorcycle.year || 'N/A'})`,
          vin: motorcycle.vin || 'N/A',
          licensePlate: motorcycle.licensePlate || 'N/A',
          fullData: motorcycle
        });
      }
    });

    return Array.from(customerMap.entries()).map(([key, data]) => ({
      key,
      ...data,
      motorcycles: Array.from(data.motorcycles)
    }));
  };

  const getMotorcycleResults = () => {
    if (!searchTerm.trim()) return [];
    
    const motorcycleMap = new Map();
    // Now search ALL jobs, not just filtered ones for mechanics
    jobs.forEach(job => {
      const motorcycle = job.motorcycle || {};
      const searchFields = [
        motorcycle.make || '',
        motorcycle.model || '',
        motorcycle.year?.toString() || '',
        motorcycle.licensePlate || '',
        motorcycle.vin || ''
      ];
      
      const matchesSearch = searchFields.some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!matchesSearch) return;
      
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
  
  // Allow mechanics to search customers and motorcycles, but restrict job details access based on permissions
  const canSearchJobs = () => {
    return permissions.canSeeAllJobs; // Only admins and support can search job details
  };

  const jobSearchEnabled = canSearchJobs();

  const ServiceHistoryDialog = ({ jobs, customerName }: { jobs: any[], customerName: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-xs">
          ... and {jobs.length - 3} more
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Service History - {customerName}</DialogTitle>
          <DialogDescription>
            All services performed for this customer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {jobs.map((job: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-muted rounded border">
              <div>
                <div className="font-medium">{job.job_id || job.id}</div>
                <div className="text-sm text-muted-foreground">{job.service_type || job.serviceType}</div>
                <div className="text-xs text-muted-foreground">
                  {job.motorcycle?.make} {job.motorcycle?.model} ({job.motorcycle?.year})
                  {job.motorcycle?.vin && (
                    <div className="font-mono">VIN: {job.motorcycle.vin}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">{new Date(job.date_created || job.dateCreated).toLocaleDateString()}</div>
                <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                  {job.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  const MotorcycleVinDialog = ({ motorcycle, display }: { motorcycle: any; display?: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-semibold">
          {display || `${motorcycle?.make} ${motorcycle?.model} (${motorcycle?.year})`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motorcycle Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Make & Model</h4>
            <p className="text-muted-foreground">{motorcycle?.make} {motorcycle?.model}</p>
          </div>
          <div>
            <h4 className="font-medium">Year</h4>
            <p className="text-muted-foreground">{motorcycle?.year || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-medium">License Plate</h4>
            <p className="text-muted-foreground">{motorcycle?.licensePlate || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-medium">VIN Number</h4>
            <p className="text-muted-foreground font-mono">{motorcycle?.vin || 'Not available'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const AllServicesDialog = ({ jobs, customerName }: { jobs: any[], customerName: string }) => {
    if (jobs.length <= 10) {
      return <ServiceHistoryDialog jobs={jobs} customerName={customerName} />;
    }

    const openInNewWindow = () => {
      const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>All Services - ${customerName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .service { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
                .service-id { font-weight: bold; }
                .service-type { color: #666; margin: 5px 0; }
                .motorcycle { font-size: 0.9em; color: #888; }
                .date { float: right; color: #666; }
                .status { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 0.8em; }
                .completed { background: #e8f5e8; color: #2d5a2d; }
                .pending { background: #fff3cd; color: #856404; }
              </style>
            </head>
            <body>
              <h1>All Services for ${customerName}</h1>
              <p>Total Services: ${jobs.length}</p>
              ${jobs.map((job: any) => `
                <div class="service">
                  <div class="service-id">${job.job_id || job.id}</div>
                  <div class="service-type">${job.service_type || job.serviceType}</div>
                  <div class="motorcycle">
                    ${job.motorcycle?.make || ''} ${job.motorcycle?.model || ''} (${job.motorcycle?.year || 'N/A'})
                    ${job.motorcycle?.vin ? `<br/>VIN: ${job.motorcycle.vin}` : ''}
                  </div>
                  <div class="date">${new Date(job.date_created || job.dateCreated).toLocaleDateString()}</div>
                  <span class="status ${job.status === 'completed' ? 'completed' : 'pending'}">${job.status}</span>
                </div>
              `).join('')}
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    };

    return (
      <Button variant="link" className="p-0 h-auto text-xs" onClick={openInNewWindow}>
        ... and {jobs.length - 3} more (Click to open in new window)
      </Button>
    );
  };

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
                            {result.motorcycles.map((motorcycle: any, index: number) => (
                              <MotorcycleVinDialog 
                                key={index} 
                                motorcycle={motorcycle.fullData} 
                                display={motorcycle.display}
                              />
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
                              <AllServicesDialog jobs={result.jobs} customerName={result.customer?.name || "Unknown Customer"} />
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
                          <MotorcycleVinDialog motorcycle={result.motorcycle} />
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
                              <AllServicesDialog jobs={result.jobs} customerName={result.customer?.name || "Motorcycle Owner"} />
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
                        <div className="text-sm text-muted-foreground">
                          <MotorcycleVinDialog motorcycle={job.motorcycle} />
                          <p>License: {job.motorcycle?.licensePlate}</p>
                        </div>
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
