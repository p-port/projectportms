
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
    if (!name) return "Unknown";
    if (name.length <= 2) return name;
    return name.charAt(0) + "*".repeat(name.length - 2) + name.charAt(name.length - 1);
  };

  const formatCustomerEmail = (email: string) => {
    if (!email) return "No email";
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    return localPart.charAt(0) + "*".repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1) + '@' + domain;
  };

  const ServiceHistoryDialog = ({ jobs, customerName }: { jobs: any[], customerName: string }) => (
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
                  {result.customer.phone && ` • ${result.customer.phone.charAt(0)}***${result.customer.phone.slice(-2)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Motorcycles Owned:</h4>
                  <div className="flex flex-wrap gap-1">
                    {result.motorcycles.map((motorcycle: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {motorcycle}
                      </Badge>
                    ))}
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
