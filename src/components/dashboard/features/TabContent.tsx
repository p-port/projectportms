
import { TabsContent } from "@/components/ui/tabs";
import { JobList } from "@/components/dashboard/JobList";
import { NewJobForm } from "@/components/dashboard/NewJobForm";
import { SearchCustomers } from "@/components/dashboard/SearchCustomers";
import { TicketList } from "@/components/dashboard/tickets/TicketList";
import { AccountInfo } from "@/components/dashboard/account/AccountInfo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShopManagement } from "../shops/ShopManagement";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface TabContentProps {
  activeJobs: any[];
  completedJobs: any[];
  allJobs: any[];
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  handleAddJob: (job: any) => void;
  userId?: string;
  userRole?: string;
  translations: any;
}

// The AccountInfoProps interface should match the props expected by the AccountInfo component
// in src/components/dashboard/account/AccountInfo.tsx
interface AccountInfoProps {
  userId?: string;
  userRole?: string;
}

export const TabContent = ({
  activeJobs,
  completedJobs,
  allJobs,
  setJobs,
  handleAddJob,
  userId,
  userRole = 'mechanic',
  translations,
}: TabContentProps) => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const goToShopManagement = () => {
    setIsRedirecting(true);
    navigate('/shop-management');
  };

  return (
    <>
      <TabsContent value="active-jobs" className="mt-6">
        <JobList
          jobs={activeJobs}
          type="active"
          setJobs={setJobs}
          allJobs={allJobs}
          translations={translations}
        />
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <JobList
          jobs={completedJobs}
          type="completed"
          setJobs={setJobs}
          allJobs={allJobs}
          translations={translations}
        />
      </TabsContent>

      <TabsContent value="new-job" className="mt-6">
        <NewJobForm onSubmit={handleAddJob} />
      </TabsContent>

      <TabsContent value="customers" className="mt-6">
        <SearchCustomers jobs={allJobs} />
      </TabsContent>
      
      <TabsContent value="shops" className="mt-6">
        {userRole === 'admin' ? (
          <Card>
            <CardHeader>
              <CardTitle>Shop Management</CardTitle>
              <CardDescription>
                Register new shops and manage existing ones in the Project Port network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={goToShopManagement} disabled={isRedirecting}>
                {isRedirecting ? "Redirecting..." : "Go to Shop Management"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">You need admin permissions to access shop management.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="support" className="mt-6">
        <TicketList userId={userId} userRole={userRole} />
      </TabsContent>

      <TabsContent value="account" className="mt-6">
        <AccountInfo userId={userId} userRole={userRole} />
      </TabsContent>
    </>
  );
};
