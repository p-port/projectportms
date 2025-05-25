
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchCustomers } from "./SearchCustomers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Bike, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SearchPanelProps {
  jobs: any[];
  translations: any;
  userRole?: string;
  userId?: string;
}

interface MotorcycleData {
  make: string;
  model: string;
  year: string;
  vin?: string;
}

interface CustomerData {
  name: string;
}

export const SearchPanel = ({ jobs, translations, userRole = 'mechanic', userId }: SearchPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [motorcycleResults, setMotorcycleResults] = useState<any[]>([]);
  const [jobResults, setJobResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      let dbQuery = supabase
        .from('jobs')
        .select('*')
        .or(`motorcycle->>make.ilike.%${query}%,motorcycle->>model.ilike.%${query}%,motorcycle->>year.ilike.%${query}%,motorcycle->>vin.ilike.%${query}%`);

      // Filter by shop for non-admin/support users
      if (!canSeeAllData && userShopId) {
        dbQuery = dbQuery.eq('shop_id', userShopId);
      }

      const { data, error } = await dbQuery.order('date_created', { ascending: false });

      if (error) throw error;

      // Group by motorcycle (VIN or make+model+year)
      const motorcycleMap = new Map();
      data?.forEach(job => {
        const motorcycle = job.motorcycle as MotorcycleData;
        const key = motorcycle.vin || `${motorcycle.make}-${motorcycle.model}-${motorcycle.year}`;
        
        if (!motorcycleMap.has(key)) {
          motorcycleMap.set(key, {
            motorcycle,
            services: [],
            owners: new Set()
          });
        }
        
        motorcycleMap.get(key).services.push({
          jobId: job.job_id,
          serviceType: job.service_type,
          date: job.date_created,
          status: job.status,
          customer: job.customer
        });
        
        const customer = job.customer as CustomerData;
        motorcycleMap.get(key).owners.add(customer.name);
      });

      const results = Array.from(motorcycleMap.entries()).map(([key, data]) => ({
        key,
        ...data,
        owners: Array.from(data.owners)
      }));

      setMotorcycleResults(results);
    } catch (error) {
      console.error('Error searching motorcycles:', error);
      setMotorcycleResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchJobs = async (query: string) => {
    if (!query.trim()) {
      setJobResults([]);
      return;
    }

    setLoading(true);
    try {
      let dbQuery = supabase
        .from('jobs')
        .select('*')
        .or(`job_id.ilike.%${query}%,service_type.ilike.%${query}%,customer->>name.ilike.%${query}%,motorcycle->>make.ilike.%${query}%,motorcycle->>model.ilike.%${query}%`);

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
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchMotorcycles(searchQuery);
    searchJobs(searchQuery);
  };

  const formatCustomerName = (name: string) => {
    if (!name) return "Unknown";
    if (name.length <= 2) return name;
    return name.charAt(0) + "*".repeat(name.length - 2) + name.charAt(name.length - 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {translations.search || "Search"}
          </CardTitle>
          <CardDescription>
            Search for customers, motorcycles, and jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={translations.searchPlaceholder || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers" className="flex gap-2 items-center">
            <User className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="motorcycles" className="flex gap-2 items-center">
            <Bike className="h-4 w-4" />
            Motorcycles
            {motorcycleResults.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {motorcycleResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex gap-2 items-center">
            <Briefcase className="h-4 w-4" />
            Jobs
            {jobResults.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {jobResults.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <SearchCustomers 
            jobs={jobs}
            userRole={userRole}
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="motorcycles">
          <div className="space-y-4">
            {loading ? (
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
                      {result.motorcycle.vin && (
                        <CardDescription>VIN: {result.motorcycle.vin}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Ownership History:</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.owners.map((owner: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {formatCustomerName(owner)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Service History:</h4>
                        <div className="space-y-2">
                          {result.services.map((service: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                              <div>
                                <span className="font-medium">{service.jobId}</span>
                                <span className="text-muted-foreground ml-2">{service.serviceType}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">{new Date(service.date).toLocaleDateString()}</div>
                                <Badge variant={service.status === 'completed' ? 'default' : 'secondary'}>
                                  {service.status}
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
            ) : searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                No motorcycles found matching "{searchQuery}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter a search term to find motorcycles
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2">Searching jobs...</p>
              </div>
            ) : jobResults.length > 0 ? (
              <div className="grid gap-4">
                {jobResults.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{job.job_id}</span>
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {job.service_type} • {new Date(job.date_created).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">Customer:</h4>
                          <p>{formatCustomerName((job.customer as CustomerData).name)}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Motorcycle:</h4>
                          <p>{(job.motorcycle as MotorcycleData).make} {(job.motorcycle as MotorcycleData).model} ({(job.motorcycle as MotorcycleData).year})</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                No jobs found matching "{searchQuery}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter a search term to find jobs
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
