
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Battery, Ticket, History, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface SearchPanelProps {
  jobs: any[];
  translations?: any;
}

// Helper function to censor part of a string in a less restrictive way
const censorName = (name: string) => {
  if (!name || name.length <= 2) return name;
  
  // For names with multiple parts (first name, last name)
  if (name.includes(" ")) {
    const parts = name.split(" ");
    return parts.map(part => {
      if (part.length <= 2) return part; // Don't censor very short name parts
      
      // Show first two letters and last letter, censor middle
      const firstChars = part.substring(0, 2);
      const lastChar = part.charAt(part.length - 1);
      const middleLength = Math.max(1, part.length - 3); // At least 1 asterisk
      const middle = '*'.repeat(middleLength);
      
      return `${firstChars}${middle}${lastChar}`;
    }).join(" ");
  }
  
  // For single names
  if (name.length <= 3) return name; // Don't censor very short names
  
  // Show first two letters and last letter, censor middle
  const firstChars = name.substring(0, 2);
  const lastChar = name.charAt(name.length - 1);
  const middleLength = Math.max(1, name.length - 3); // At least 1 asterisk
  const middle = '*'.repeat(middleLength);
  
  return `${firstChars}${middle}${lastChar}`;
};

export const SearchPanel = ({ jobs, translations }: SearchPanelProps) => {
  const [searchType, setSearchType] = useState<string>("customer");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setHasSearched(true);
    setSelectedOwner(null);
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
              // Create a new motorcycle entry
              motorcycleMap.set(key, {
                make: job.motorcycle.make,
                model: job.motorcycle.model,
                year: job.motorcycle.year || "N/A",
                vin: job.motorcycle.vin || "N/A",
                ownershipHistory: job.customer ? [{
                  name: censorName(job.customer.name),
                  jobId: job.id,
                  dateServiced: job.dateCreated,
                  lastDateServiced: job.dateCreated
                }] : [],
                serviceHistory: [job],
                allServicesByOwner: job.customer ? {
                  [censorName(job.customer.name)]: [job]
                } : {}
              });
            } else {
              const motorcycle = motorcycleMap.get(key);
              
              // Add this job to service history
              motorcycle.serviceHistory.push(job);
              
              // Group services by owner
              if (job.customer) {
                const ownerName = censorName(job.customer.name);
                if (!motorcycle.allServicesByOwner[ownerName]) {
                  motorcycle.allServicesByOwner[ownerName] = [];
                }
                motorcycle.allServicesByOwner[ownerName].push(job);
              }
              
              // Check if this is a different owner than the last one in ownership history
              if (job.customer) {
                const lastOwner = motorcycle.ownershipHistory.length > 0 ? 
                  motorcycle.ownershipHistory[motorcycle.ownershipHistory.length - 1] : null;
                
                if (lastOwner && censorName(job.customer.name) === lastOwner.name) {
                  // Same owner, just update the last service date
                  lastOwner.lastDateServiced = job.dateCreated;
                } else {
                  // Different owner, add to ownership history
                  motorcycle.ownershipHistory.push({
                    name: censorName(job.customer.name),
                    jobId: job.id,
                    dateServiced: job.dateCreated,
                    lastDateServiced: job.dateCreated
                  });
                }
              }
              
              motorcycleMap.set(key, motorcycle);
            }
          }
        });
        
        // Sort service history by date (newest first) for each motorcycle
        const motorcycleResults = Array.from(motorcycleMap.values());
        motorcycleResults.forEach(motorcycle => {
          // Sort service history by date (newest first)
          motorcycle.serviceHistory.sort((a: any, b: any) => 
            new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
          );
          
          // Sort ownership history by last service date (newest first)
          motorcycle.ownershipHistory.sort((a: any, b: any) => 
            new Date(b.lastDateServiced).getTime() - new Date(a.lastDateServiced).getTime()
          );
          
          // Mark the current owner (the most recent one)
          if (motorcycle.ownershipHistory && motorcycle.ownershipHistory.length > 0) {
            motorcycle.currentOwner = motorcycle.ownershipHistory[0];
            motorcycle.previousOwners = motorcycle.ownershipHistory.slice(1);
          } else {
            motorcycle.currentOwner = null;
            motorcycle.previousOwners = [];
          }

          // For each owner, sort their services by date (newest first)
          Object.keys(motorcycle.allServicesByOwner).forEach(owner => {
            motorcycle.allServicesByOwner[owner].sort((a: any, b: any) => 
              new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
            );
          });
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

  // Function to handle owner selection to filter service history
  const handleOwnerSelect = (motorcycle: any, ownerName: string) => {
    setSelectedOwner(ownerName === selectedOwner ? null : ownerName);
  };

  // Function to get filtered service history based on selected owner
  const getFilteredServiceHistory = (motorcycle: any) => {
    if (!selectedOwner) {
      // If no owner selected, return the last 10 services
      return motorcycle.serviceHistory.slice(0, 10);
    }
    
    // Return services for the selected owner (up to 10)
    return motorcycle.allServicesByOwner[selectedOwner]?.slice(0, 10) || [];
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
                          <Badge variant="outline" className="flex gap-1 items-center">
                            <History className="h-3 w-3" />
                            Services: {motorcycle.serviceHistory.length}
                          </Badge>
                        </div>
                        
                        {/* Ownership History Section with Selectable Buttons */}
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-2">Ownership History</h5>
                          <div className="space-y-2">
                            {motorcycle.currentOwner && (
                              <div className={`p-3 rounded text-sm border cursor-pointer transition-colors ${selectedOwner === motorcycle.currentOwner.name ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}
                                onClick={() => handleOwnerSelect(motorcycle, motorcycle.currentOwner.name)}>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Current Owner: {motorcycle.currentOwner.name}</span>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-green-100 dark:bg-green-800 border-green-200 dark:border-green-700">
                                      Current
                                    </Badge>
                                    {selectedOwner === motorcycle.currentOwner.name && (
                                      <Badge variant="secondary">
                                        Selected
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  First Seen: {motorcycle.currentOwner.dateServiced}
                                  {motorcycle.currentOwner.dateServiced !== motorcycle.currentOwner.lastDateServiced && 
                                    ` • Last Seen: ${motorcycle.currentOwner.lastDateServiced}`}
                                </p>
                                {selectedOwner === motorcycle.currentOwner.name && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Services: {motorcycle.allServicesByOwner[motorcycle.currentOwner.name]?.length || 0}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {motorcycle.previousOwners && motorcycle.previousOwners.length > 0 ? (
                              <div className="space-y-2">
                                {motorcycle.previousOwners.map((owner: any, ownerIndex: number) => (
                                  <div key={ownerIndex} 
                                    className={`p-3 rounded text-sm cursor-pointer transition-colors ${selectedOwner === owner.name ? 'bg-muted/80 border border-muted-foreground/20' : 'bg-muted border border-transparent'}`}
                                    onClick={() => handleOwnerSelect(motorcycle, owner.name)}>
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">Previous Owner: {owner.name}</span>
                                      {selectedOwner === owner.name && (
                                        <Badge variant="secondary">
                                          Selected
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      First Seen: {owner.dateServiced}
                                      {owner.dateServiced !== owner.lastDateServiced && 
                                        ` • Last Seen: ${owner.lastDateServiced}`}
                                    </p>
                                    {selectedOwner === owner.name && (
                                      <div className="mt-2 text-xs text-muted-foreground">
                                        Services: {motorcycle.allServicesByOwner[owner.name]?.length || 0}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-sm">No previous owners found.</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Service History Section */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-sm">Service History</h5>
                            <div className="flex gap-2 items-center">
                              {selectedOwner ? (
                                <Badge variant="outline" className="flex gap-1 items-center">
                                  <User className="h-3 w-3" /> 
                                  Filtered by: {selectedOwner}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex gap-1 items-center">
                                  <List className="h-3 w-3" /> 
                                  Last 10 services
                                </Badge>
                              )}
                              {selectedOwner && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs px-2" 
                                  onClick={() => setSelectedOwner(null)}>
                                  Clear
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {getFilteredServiceHistory(motorcycle).length > 0 ? (
                              getFilteredServiceHistory(motorcycle).map((job: any, jobIndex: number) => (
                                <div key={jobIndex} className="bg-muted/50 p-3 rounded text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium">Job ID: {job.id}</span>
                                    <span>{job.dateCreated}</span>
                                  </div>
                                  <p>{job.serviceType}</p>
                                  <p className="text-muted-foreground">Status: {job.status}</p>
                                  <p className="text-xs text-muted-foreground">Owner: {job.customer ? censorName(job.customer.name) : 'Unknown'}</p>
                                </div>
                              ))
                            ) : (
                              <div className="bg-muted/50 p-3 rounded text-sm text-center">
                                No service history available for the selected filter.
                              </div>
                            )}
                            
                            {!selectedOwner && motorcycle.serviceHistory.length > 10 && (
                              <div className="text-center text-xs text-muted-foreground mt-2">
                                Showing 10 of {motorcycle.serviceHistory.length} services. Select an owner to filter.
                              </div>
                            )}
                            
                            {selectedOwner && motorcycle.allServicesByOwner[selectedOwner]?.length > 10 && (
                              <div className="text-center text-xs text-muted-foreground mt-2">
                                Showing 10 of {motorcycle.allServicesByOwner[selectedOwner].length} services for this owner.
                              </div>
                            )}
                          </div>
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
