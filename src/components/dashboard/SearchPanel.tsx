
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Wrench, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SearchCustomers } from "./SearchCustomers";

interface SearchPanelProps {
  jobs: any[];
  userRole?: string;
  userId?: string;
}

interface MotorcycleData {
  make: string;
  model: string;
  year: number;
  vin?: string;
  engineNumber?: string;
  plateNumber?: string;
}

export const SearchPanel = ({ jobs, userRole = 'mechanic', userId }: SearchPanelProps) => {
  const [activeTab, setActiveTab] = useState("customers");
  const [motorcycleResults, setMotorcycleResults] = useState<any[]>([]);
  const [jobResults, setJobResults] = useState<any[]>([]);
  const [motorcycleQuery, setMotorcycleQuery] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [motorcycleLoading, setMotorcycleLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [userShopId, setUserShopId] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';
  const isSupport = userRole === 'support';
  const canSeeAllData = isAdmin || isSupport;

  // Get user's shop ID for filtering
  useEffect(() => {
    if (userId && !canSeeAllData) {
      const fetchUserShop = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('shop_id')
          .eq('id', userId)
          .single();
        
        if (data?.shop_id) {
          setUserShopId(data.shop_id);
        }
      };
      
      fetchUserShop();
    }
  }, [userId, canSeeAllData]);

  const searchMotorcycles = async (query: string) => {
    if (!query.trim()) {
      setMotorcycleResults([]);
      return;
    }

    setMotorcycleLoading(true);
    try {
      let dbQuery = supabase
        .from('jobs')
        .select('*')
        .or(`motorcycle->>make.ilike.%${query}%,motorcycle->>model.ilike.%${query}%,motorcycle->>vin.ilike.%${query}%,motorcycle->>engineNumber.ilike.%${query}%,motorcycle->>plateNumber.ilike.%${query}%`);

      // Filter by shop for non-admin/support users
      if (!canSeeAllData && userShopId) {
        dbQuery = dbQuery.eq('shop_id', userShopId);
      }

      const { data, error } = await dbQuery.order('date_created', { ascending: false });

      if (error) throw error;

      // Group by motorcycle
      const motorcycleMap = new Map();
      data?.forEach(job => {
        const motorcycle = job.motorcycle as unknown as MotorcycleData;
        const key = `${motorcycle.make}-${motorcycle.model}-${motorcycle.year}-${motorcycle.vin || ''}`;
        
        if (!motorcycleMap.has(key)) {
          motorcycleMap.set(key, {
            motorcycle,
            jobs: [],
            customers: new Set()
          });
        }
        
        motorcycleMap.get(key).jobs.push({
          jobId: job.job_id,
          serviceType: job.service_type,
          date: job.date_created,
          status: job.status,
          customer: job.customer
        });
        
        const customer = job.customer as any;
        motorcycleMap.get(key).customers.add(customer.name || customer.email);
      });

      const results = Array.from(motorcycleMap.entries()).map(([key, data]) => ({
        key,
        ...data,
        customers: Array.from(data.customers)
      }));

      setMotorcycleResults(results);
    } catch (error) {
      console.error('Error searching motorcycles:', error);
      setMotorcycleResults([]);
    } finally {
      setMotorcycleLoading(false);
    }
  };

  const searchJobs = async (query: string) => {
    if (!query.trim()) {
      setJobResults([]);
      return;
    }

    setJobLoading(true);
    try {
      let dbQuery = supabase
        .from('jobs')
        .select('*')
        .or(`job_id.ilike.%${query}%,service_type.ilike.%${query}%,status.ilike.%${query}%`);

      // Filter by shop for non-admin/support users
      if (!canSeeAllData && userShopId) {
        dbQuery = dbQuery.eq('shop_id', userShopId);
      }

      const { data, error } = await dbQuery.order('date_created', { ascending: false });

      if (error) throw error;
      setJobResults(data || []);
    } catch (error) {
      console.error('Error searching jobs:', error);
      setJobResults([]);
    } finally {
      setJobLoading(false);
    }
  };

  const handleMotorcycleSearch = () => {
    searchMotorcycles(motorcycleQuery);
  };

  const handleJobSearch = () => {
    searchJobs(jobQuery);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="motorcycles" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Motorcycles
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <SearchCustomers jobs={jobs} userRole={userRole} userId={userId} />
          </TabsContent>

          <TabsContent value="motorcycles" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search motorcycles..."
                value={motorcycleQuery}
                onChange={(e) => setMotorcycleQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMotorcycleSearch()}
              />
              <Button onClick={handleMotorcycleSearch} disabled={motorcycleLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {motorcycleLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2">Searching motorcycles...</p>
              </div>
            ) : motorcycleResults.length > 0 ? (
              <div className="grid gap-4">
                {motorcycleResults.map((result) => (
                  <Card key={result.key}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {result.motorcycle.make} {result.motorcycle.model} ({result.motorcycle.year})
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {result.motorcycle.vin && <span>VIN: {result.motorcycle.vin}</span>}
                        {result.motorcycle.plateNumber && <span>Plate: {result.motorcycle.plateNumber}</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Owners:</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.customers.map((customer: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {customer}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Service History:</h4>
                        <div className="space-y-2">
                          {result.jobs.map((job: any, index: number) => (
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : motorcycleQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                No motorcycles found matching "{motorcycleQuery}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter a search term to find motorcycles
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search jobs..."
                value={jobQuery}
                onChange={(e) => setJobQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJobSearch()}
              />
              <Button onClick={handleJobSearch} disabled={jobLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {jobLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2">Searching jobs...</p>
              </div>
            ) : jobResults.length > 0 ? (
              <div className="grid gap-4">
                {jobResults.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{job.job_id}</CardTitle>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{job.service_type}</span>
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Customer: </span>
                          <span>{(job.customer as any).name || (job.customer as any).email}</span>
                        </div>
                        <div>
                          <span className="font-medium">Motorcycle: </span>
                          <span>{(job.motorcycle as any).make} {(job.motorcycle as any).model} ({(job.motorcycle as any).year})</span>
                        </div>
                        <div>
                          <span className="font-medium">Date: </span>
                          <span>{new Date(job.date_created).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                No jobs found matching "{jobQuery}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter a search term to find jobs
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
