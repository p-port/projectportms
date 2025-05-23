
import { TabsContent } from "@/components/ui/tabs";
import { JobList } from "@/components/dashboard/JobList";
import { NewJobForm } from "@/components/dashboard/NewJobForm";
import { SearchPanel } from "@/components/dashboard/SearchPanel";
import { TicketList } from "@/components/dashboard/tickets/TicketList";
import { AccountInfo } from "@/components/dashboard/account/AccountInfo";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShopManagement } from "../shops/ShopManagement";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";

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

  const goToShopOwners = () => {
    setIsRedirecting(true);
    navigate('/shop-owners');
  };

  const isAdmin = userRole === 'admin';

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
        <SearchPanel jobs={allJobs} translations={translations} />
      </TabsContent>
      
      <TabsContent value="shops" className="mt-6">
        {userRole === 'admin' ? (
          <div className="grid gap-4">
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
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Shop Owners Management
                </CardTitle>
                <CardDescription>
                  View all shops and manage shop ownership permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={goToShopOwners} disabled={isRedirecting} variant="outline">
                  {isRedirecting ? "Redirecting..." : "Manage Shop Owners"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">You need admin permissions to access shop management.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        {isAdmin ? (
          <UserManagement />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">You need admin permissions to access user management.</p>
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
