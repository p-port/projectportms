
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobList } from "./JobList";
import { NewJobForm } from "./NewJobForm";
import { SearchCustomers } from "./SearchCustomers";
import { Search } from "lucide-react";

interface DashboardProps {
  user: any;
}

// Sample jobs data
const SAMPLE_JOBS = [
  {
    id: "JOB-2023-001",
    customer: {
      name: "Michael Johnson",
      phone: "555-123-4567",
      email: "michael@example.com"
    },
    motorcycle: {
      make: "Honda",
      model: "CBR600RR",
      year: "2020",
      vin: "1HGCM82633A123456"
    },
    serviceType: "Oil Change & Tune-up",
    status: "in-progress",
    dateCreated: "2023-05-18",
    notes: [
      { text: "Initial inspection completed", timestamp: "2023-05-18T10:30:00" },
      { text: "Parts ordered", timestamp: "2023-05-18T14:15:00" }
    ],
    photos: {
      start: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
      completion: []
    }
  },
  {
    id: "JOB-2023-002",
    customer: {
      name: "Sarah Williams",
      phone: "555-987-6543",
      email: "sarah@example.com"
    },
    motorcycle: {
      make: "Kawasaki",
      model: "Ninja 650",
      year: "2021",
      vin: "JKAZXCE17MA012345"
    },
    serviceType: "Brake replacement",
    status: "completed",
    dateCreated: "2023-05-15",
    dateCompleted: "2023-05-17",
    notes: [
      { text: "Front and rear brake pads replaced", timestamp: "2023-05-15T11:00:00" },
      { text: "Brake fluid flushed and replaced", timestamp: "2023-05-16T09:45:00" },
      { text: "Final inspection completed", timestamp: "2023-05-17T14:30:00" }
    ],
    photos: {
      start: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
      completion: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"]
    }
  },
  {
    id: "JOB-2023-003",
    customer: {
      name: "David Thompson",
      phone: "555-456-7890",
      email: "david@example.com"
    },
    motorcycle: {
      make: "Yamaha",
      model: "MT-09",
      year: "2022",
      vin: "JYARN23E9NA001234"
    },
    serviceType: "Chain replacement & adjustment",
    status: "pending",
    dateCreated: "2023-05-19",
    notes: [],
    photos: {
      start: [],
      completion: []
    }
  }
];

export const Dashboard = ({ user }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("active-jobs");
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Load jobs from localStorage or use sample data on first load
  useEffect(() => {
    const storedJobsString = localStorage.getItem('projectPortJobs');
    if (storedJobsString) {
      const storedJobs = JSON.parse(storedJobsString);
      setJobs(storedJobs);
    } else {
      setJobs(SAMPLE_JOBS);
      // Store the sample jobs in localStorage
      localStorage.setItem('projectPortJobs', JSON.stringify(SAMPLE_JOBS));
    }
  }, []);

  // Update localStorage whenever jobs change
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('projectPortJobs', JSON.stringify(jobs));
      console.log("Jobs updated in localStorage:", jobs);
    }
  }, [jobs]);

  const handleAddJob = (jobData: any) => {
    const newJob = {
      ...jobData,
      id: `JOB-${new Date().getFullYear()}-${String(jobs.length + 1).padStart(3, '0')}`,
      dateCreated: new Date().toISOString().split('T')[0],
      status: "pending",
      notes: [],
      photos: {
        start: [],
        completion: []
      }
    };
    
    const updatedJobs = [newJob, ...jobs];
    setJobs(updatedJobs);
    localStorage.setItem('projectPortJobs', JSON.stringify(updatedJobs));
    setActiveTab("active-jobs");
  };

  const filteredJobs = searchQuery 
    ? jobs.filter(job => 
        job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.motorcycle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.motorcycle.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  const activeJobs = filteredJobs.filter(job => job.status !== "completed");
  const completedJobs = filteredJobs.filter(job => job.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.name || "Mechanic"}</p>
      </div>

      <div className="flex w-full items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by ID, customer name, or motorcycle..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="active-jobs">Active Jobs ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="completed-jobs">Completed ({completedJobs.length})</TabsTrigger>
          <TabsTrigger value="new-job">New Job</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="active-jobs">
          <JobList jobs={activeJobs} type="active" setJobs={setJobs} allJobs={jobs} />
        </TabsContent>

        <TabsContent value="completed-jobs">
          <JobList jobs={completedJobs} type="completed" setJobs={setJobs} allJobs={jobs} />
        </TabsContent>

        <TabsContent value="new-job">
          <NewJobForm onSubmit={handleAddJob} />
        </TabsContent>

        <TabsContent value="customers">
          <SearchCustomers jobs={jobs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
