
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search } from "lucide-react";

interface SearchCustomersProps {
  jobs: any[];
  userRole?: string;
  userId?: string;
}

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
}

export const SearchCustomers = ({ jobs, userRole = 'mechanic', userId }: SearchCustomersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole === 'admin';
  const isSupport = userRole === 'support';
  const canSeeAllData = isAdmin || isSupport;

  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setCustomerResults([]);
      return;
    }

    setLoading(true);
    try {
      // Filter the jobs prop based on search query
      const filteredJobs = jobs.filter(job => {
        const customer = job.customer as unknown as CustomerData;
        const searchFields = [
          customer?.name || '',
          customer?.email || '',
          customer?.phone || ''
        ];
        
        return searchFields.some(field => 
          field.toLowerCase().includes(query.toLowerCase())
        );
      });

      // Group by customer
      const customerMap = new Map();
      filteredJobs.forEach(job => {
        const customer = job.customer as unknown as CustomerData;
        const key = customer.email || customer.name;
        
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customer,
            jobs: [],
            motorcycles: new Set()
          });
        }
        
        customerMap.get(key).jobs.push({
          jobId: job.job_id,
          serviceType: job.service_type,
          date: job.date_created,
          status: job.status,
          motorcycle: job.motorcycle
        });
        
        const motorcycle = job.motorcycle as any;
        customerMap.get(key).motorcycles.add(`${motorcycle.make} ${motorcycle.model} (${motorcycle.year})`);
      });

      const results = Array.from(customerMap.entries()).map(([key, data]) => ({
        key,
        ...data,
        motorcycles: Array.from(data.motorcycles)
      }));

      setCustomerResults(results);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchCustomers(searchQuery);
  };

  const formatCustomerName = (name: string) => {
    if (!canSeeAllData) {
      if (!name) return "Unknown";
      if (name.length <= 2) return name;
      return name.charAt(0) + "*".repeat(name.length - 2) + name.charAt(name.length - 1);
    }
    return name || "Unknown";
  };

  const formatCustomerEmail = (email: string) => {
    if (!canSeeAllData) {
      if (!email) return "No email";
      const [localPart, domain] = email.split('@');
      if (localPart.length <= 2) return email;
      return localPart.charAt(0) + "*".repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1) + '@' + domain;
    }
    return email || "No email";
  };

  const formatPhone = (phone: string) => {
    if (!canSeeAllData) {
      if (!phone) return "N/A";
      if (phone.length <= 4) return phone;
      return phone.charAt(0) + "*".repeat(phone.length - 4) + phone.slice(-3);
    }
    return phone || "N/A";
  };

  const ServiceHistoryDialog = ({ jobs, customerName }: { jobs: any[], customerName: string }) => {
    const AllServicesDialog = () => {
      if (jobs.length <= 10) {
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-sm">
                View All Services ({jobs.length})
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
                      <div className="font-medium">{job.jobId}</div>
                      <div className="text-sm text-muted-foreground">{job.serviceType}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.motorcycle?.make} {job.motorcycle?.model} ({job.motorcycle?.year})
                        {job.motorcycle?.vin && (
                          <div className="font-mono">VIN: {job.motorcycle.vin}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{new Date(job.date).toLocaleDateString()}</div>
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
                    <div class="service-id">${job.jobId}</div>
                    <div class="service-type">${job.serviceType}</div>
                    <div class="motorcycle">
                      ${job.motorcycle?.make || ''} ${job.motorcycle?.model || ''} (${job.motorcycle?.year || 'N/A'})
                      ${job.motorcycle?.vin ? `<br/>VIN: ${job.motorcycle.vin}` : ''}
                    </div>
                    <div class="date">${new Date(job.date).toLocaleDateString()}</div>
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
        <Button variant="link" className="p-0 h-auto text-sm" onClick={openInNewWindow}>
          View All Services ({jobs.length}) - Click to open in new window
        </Button>
      );
    };

    return <AllServicesDialog />;
  };

  const MotorcycleVinDialog = ({ motorcycle, display }: { motorcycle: any, display: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">
          {display}
        </Badge>
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2">Searching customers...</p>
        </div>
      ) : customerResults.length > 0 ? (
        <div className="grid gap-4">
          {customerResults.map((result) => (
            <Card key={result.key}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {formatCustomerName(result.customer.name)}
                </CardTitle>
                <CardDescription>
                  {formatCustomerEmail(result.customer.email)}
                  {result.customer.phone && ` • ${formatPhone(result.customer.phone)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Motorcycles Owned:</h4>
                  <div className="flex flex-wrap gap-1">
                    {result.motorcycles.map((motorcycle: string, index: number) => {
                      const job = result.jobs.find((j: any) => 
                        `${j.motorcycle?.make} ${j.motorcycle?.model} (${j.motorcycle?.year})` === motorcycle
                      );
                      return (
                        <MotorcycleVinDialog 
                          key={index} 
                          motorcycle={job?.motorcycle} 
                          display={motorcycle}
                        />
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Service History:</h4>
                  <div className="space-y-2">
                    {result.jobs.slice(0, 5).map((job: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{job.jobId}</span>
                          <span className="text-muted-foreground ml-2">{job.serviceType}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{new Date(job.date).toLocaleDateString()}</div>
                          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {result.jobs.length > 5 && (
                      <ServiceHistoryDialog jobs={result.jobs} customerName={result.customer.name} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-8 text-muted-foreground">
          No customers found matching "{searchQuery}"
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Enter a search term to find customers
        </div>
      )}
    </div>
  );
};
