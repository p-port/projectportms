
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";

interface SearchCustomersProps {
  jobs: any[];
}

export const SearchCustomers = ({ jobs }: SearchCustomersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Extract unique customers from jobs
  const uniqueCustomers = jobs.reduce((acc: any[], job) => {
    const existingCustomer = acc.find(
      (c) => c.email === job.customer.email
    );
    if (!existingCustomer) {
      acc.push({
        ...job.customer,
        jobCount: 1,
      });
    } else {
      existingCustomer.jobCount += 1;
    }
    return acc;
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = uniqueCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
    );

    setSearchResults(results);
    setSelectedCustomer(null);
  };

  const handleCustomerClick = (customer: any) => {
    // Find all jobs for this customer
    const customerJobs = jobs.filter(
      (job) => job.customer.email === customer.email
    );
    
    setSelectedCustomer({
      ...customer,
      jobs: customerJobs,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on-hold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email or phone..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No customers found
          </h3>
          <p className="mt-1 text-gray-500">
            Try a different search term or add a new customer
          </p>
        </div>
      )}

      {searchResults.length > 0 && !selectedCustomer && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">
            Search Results ({searchResults.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((customer, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleCustomerClick(customer)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {customer.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customer.phone}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {customer.jobCount} job{customer.jobCount !== 1 && "s"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">{selectedCustomer.name}</h2>
            <Button
              variant="outline"
              onClick={() => setSelectedCustomer(null)}
            >
              Back to Results
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Email:</p>
                      <p>{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone:</p>
                      <p>{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Service History</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    This customer has {selectedCustomer.jobs.length} service
                    {selectedCustomer.jobs.length !== 1 && "s"} on record
                  </p>

                  <div className="space-y-4">
                    {selectedCustomer.jobs.map((job: any, index: number) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="border-l-4 border-primary p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{job.id}</p>
                              <p className="text-sm">
                                {job.motorcycle.make} {job.motorcycle.model}{" "}
                                ({job.motorcycle.year})
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {job.serviceType}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                className={`${getStatusColor(
                                  job.status
                                )} capitalize`}
                              >
                                {job.status.replace("-", " ")}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Created: {job.dateCreated}
                              </p>
                              {job.dateCompleted && (
                                <p className="text-xs text-muted-foreground">
                                  Completed: {job.dateCompleted}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
