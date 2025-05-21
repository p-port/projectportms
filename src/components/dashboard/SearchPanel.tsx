
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Battery, Ticket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface SearchPanelProps {
  jobs: any[];
  translations?: any;
}

// Helper function to censor part of a string
const censorName = (name: string) => {
  if (!name || name.length <= 3) return name;
  const firstChar = name.charAt(0);
  const lastChar = name.charAt(name.length - 1);
  const middle = '*'.repeat(Math.min(name.length - 2, 3));
  return `${firstChar}${middle}${lastChar}`;
};

export const SearchPanel = ({ jobs, translations }: SearchPanelProps) => {
  const [searchType, setSearchType] = useState<string>("customer");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setHasSearched(true);
    const query = searchQuery.toLowerCase().trim();
    let results: any[] = [];

    switch (searchType) {
      case "customer":
        // Find unique customers matching the search query
        const customerMap = new Map();
        jobs.forEach(job => {
          if (job.customer && job.customer.name && 
              job.customer.name.toLowerCase().includes(query)) {
            if (!customerMap.has(job.customer.name)) {
              customerMap.set(job.customer.name, {
                name: job.customer.name,
                phone: job.customer.phone || "N/A",
                email: job.customer.email || "N/A",
                jobsCount: 1,
                jobs: [job]
              });
            } else {
              const customer = customerMap.get(job.customer.name);
              customer.jobsCount += 1;
              customer.jobs.push(job);
              customerMap.set(job.customer.name, customer);
            }
          }
        });
        results = Array.from(customerMap.values());
        break;
        
      case "motorcycle":
        // Find unique motorcycles matching the search query (make, model, or VIN)
        const motorcycleMap = new Map();
        jobs.forEach(job => {
          if (job.motorcycle && 
              ((job.motorcycle.make && job.motorcycle.make.toLowerCase().includes(query)) || 
               (job.motorcycle.model && job.motorcycle.model.toLowerCase().includes(query)) || 
               (job.motorcycle.vin && job.motorcycle.vin.toLowerCase().includes(query)))) {
            
            const key = `${job.motorcycle.make}-${job.motorcycle.model}-${job.motorcycle.vin || ''}`;
            
            if (!motorcycleMap.has(key)) {
              // Create a new motorcycle entry with the first owner
              motorcycleMap.set(key, {
                make: job.motorcycle.make,
                model: job.motorcycle.model,
                year: job.motorcycle.year || "N/A",
                vin: job.motorcycle.vin || "N/A",
                currentOwner: job.customer ? {
                  name: censorName(job.customer.name),
                  jobId: job.id,
                  dateServiced: job.dateCreated
                } : null,
                previousOwners: [],
                serviceHistory: [job]
              });
            } else {
              const motorcycle = motorcycleMap.get(key);
              
              // Check if this is a different owner than the current one
              if (job.customer && motorcycle.currentOwner && 
                  job.customer.name !== motorcycle.currentOwner.name) {
                
                // Find if this owner is already in previous owners
                const existingOwnerIndex = motorcycle.previousOwners.findIndex(
                  (owner: any) => owner.name === censorName(job.customer.name)
                );
                
                // If current job is more recent than our stored current owner,
                // update current owner and move the old one to previous owners
                if (new Date(job.dateCreated) > new Date(motorcycle.currentOwner.dateServiced)) {
                  // Add current owner to previous owners if not already there
                  if (!motorcycle.previousOwners.some((owner: any) => 
                      owner.name === motorcycle.currentOwner.name)) {
                    motorcycle.previousOwners.push({
                      name: motorcycle.currentOwner.name,
                      jobId: motorcycle.currentOwner.jobId,
                      dateServiced: motorcycle.currentOwner.dateServiced
                    });
                  }
                  
                  // Set new current owner
                  motorcycle.currentOwner = {
                    name: censorName(job.customer.name),
                    jobId: job.id,
                    dateServiced: job.dateCreated
                  };
                  
                  // Remove from previous owners if it exists there
                  if (existingOwnerIndex >= 0) {
                    motorcycle.previousOwners.splice(existingOwnerIndex, 1);
                  }
                } else if (existingOwnerIndex < 0) {
                  // This is a different owner but not more recent - add to previous owners
                  motorcycle.previousOwners.push({
                    name: censorName(job.customer.name),
                    jobId: job.id,
                    dateServiced: job.dateCreated
                  });
                }
              }
              
              // Add this job to service history
              motorcycle.serviceHistory.push(job);
              motorcycleMap.set(key, motorcycle);
            }
          }
        });
        
        // Sort previous owners by most recent service date for each motorcycle
        const motorcycleResults = Array.from(motorcycleMap.values());
        motorcycleResults.forEach(motorcycle => {
          motorcycle.previousOwners.sort((a: any, b: any) => 
            new Date(b.dateServiced).getTime() - new Date(a.dateServiced).getTime()
          );
          
          // Sort service history by date (newest first)
          motorcycle.serviceHistory.sort((a: any, b: any) => 
            new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
          );
        });
        
        results = motorcycleResults;
        break;
        
      case "job":
        // Find jobs matching the search query (by ID)
        results = jobs.filter(job => 
          job.id.toLowerCase().includes(query)
        );
        break;
    }

    setSearchResults(results);
    if (results.length === 0) {
      toast.info("No results found for your search");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Tabs value={searchType} onValueChange={setSearchType}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="customer">
                  <User className="mr-2 h-4 w-4" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="motorcycle">
                  <Battery className="mr-2 h-4 w-4" />
                  Motorcycles
                </TabsTrigger>
                <TabsTrigger value="job">
                  <Ticket className="mr-2 h-4 w-4" />
                  Jobs
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${searchType}s...`}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardContent className="pt-6">
            {searchType === "customer" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer Results ({searchResults.length})</h3>
                {searchResults.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Total Jobs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((customer, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>
                            {customer.phone !== "N/A" && <div>{customer.phone}</div>}
                            {customer.email !== "N/A" && <div className="text-muted-foreground">{customer.email}</div>}
                          </TableCell>
                          <TableCell>{customer.jobsCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No customers found matching your search.
                  </div>
                )}
              </div>
            )}

            {searchType === "motorcycle" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Motorcycle Results ({searchResults.length})</h3>
                {searchResults.length > 0 ? (
                  <div className="space-y-6">
                    {searchResults.map((motorcycle, index) => (
                      <div key={index} className="border p-4 rounded-lg">
                        <div className="flex flex-wrap justify-between items-start mb-3">
                          <div>
                            <h4 className="text-md font-semibold">{motorcycle.make} {motorcycle.model} {motorcycle.year}</h4>
                            <p className="text-sm text-muted-foreground">VIN: {motorcycle.vin}</p>
                          </div>
                          <Badge variant="outline">Services: {motorcycle.serviceHistory.length}</Badge>
                        </div>
                        
                        {/* Ownership History Section */}
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-2">Ownership History</h5>
                          <div className="space-y-2">
                            {motorcycle.currentOwner && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm border border-green-200 dark:border-green-800">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Current Owner: {motorcycle.currentOwner.name}</span>
                                  <Badge variant="outline" className="bg-green-100 dark:bg-green-800 border-green-200 dark:border-green-700">
                                    Current
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">Last Service: {motorcycle.currentOwner.dateServiced}</p>
                              </div>
                            )}
                            
                            {motorcycle.previousOwners && motorcycle.previousOwners.length > 0 && (
                              <div className="space-y-2">
                                {motorcycle.previousOwners.map((owner: any, ownerIndex: number) => (
                                  <div key={ownerIndex} className="bg-muted p-3 rounded text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">Previous Owner: {owner.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Service Date: {owner.dateServiced}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <h5 className="font-medium text-sm mb-2">Service History</h5>
                        <div className="space-y-2">
                          {motorcycle.serviceHistory.map((job: any, jobIndex: number) => (
                            <div key={jobIndex} className="bg-muted/50 p-3 rounded text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">Job ID: {job.id}</span>
                                <span>{job.dateCreated}</span>
                              </div>
                              <p>{job.serviceType}</p>
                              <p className="text-muted-foreground">Status: {job.status}</p>
                              <p className="text-xs text-muted-foreground">Owner: {job.customer ? censorName(job.customer.name) : 'Unknown'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No motorcycles found matching your search.
                  </div>
                )}
              </div>
            )}

            {searchType === "job" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Job Results ({searchResults.length})</h3>
                {searchResults.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Motorcycle</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((job, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{job.id}</TableCell>
                          <TableCell>{job.customer?.name || "N/A"}</TableCell>
                          <TableCell>{job.motorcycle ? `${job.motorcycle.make} ${job.motorcycle.model}` : "N/A"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                job.status === "completed" ? "success" : 
                                job.status === "in_progress" ? "warning" : 
                                "outline"
                              }
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No jobs found matching your search.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
