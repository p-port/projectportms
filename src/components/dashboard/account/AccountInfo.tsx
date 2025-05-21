
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Bell, Info } from "lucide-react";

interface AccountInfoProps {
  userId: string;
}

interface UserActivity {
  type: string;
  description: string;
  date: string;
}

export const AccountInfo = ({ userId }: AccountInfoProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setUserProfile(data);

        // Fetch user's notifications
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notifError) throw notifError;
        setNotifications(notifData || []);

        // Generate sample activities based on when the user account was created
        if (data) {
          const mockActivities = [
            {
              type: "account",
              description: "Account created",
              date: data.created_at
            }
          ];
          
          // Add login activity (simulated)
          const loginDate = new Date();
          loginDate.setHours(loginDate.getHours() - 1);
          mockActivities.push({
            type: "login",
            description: "User logged in",
            date: loginDate.toISOString()
          });

          setActivities(mockActivities);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center p-4">Loading account information...</div>;
  }

  if (!userProfile) {
    return <div className="text-center p-4">User profile not found</div>;
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'support':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd>{userProfile.name || 'Not specified'}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd>{userProfile.email || 'Not specified'}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd>
                <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                  {userProfile.role || 'User'}
                </Badge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Account Status</dt>
              <dd>
                <Badge variant={userProfile.approved ? "success" : "warning"}>
                  {userProfile.approved ? 'Approved' : 'Pending Approval'}
                </Badge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
              <dd>
                {userProfile.created_at ? format(new Date(userProfile.created_at), 'PPP') : 'N/A'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your recent account activity and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Account Activity</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">{activity.type}</TableCell>
                      <TableCell>{activity.description}</TableCell>
                      <TableCell>
                        {format(new Date(activity.date), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">No activity recorded</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <h4 className="text-sm font-medium mt-6">Recent Notifications</h4>
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded border ${notification.is_read ? 'bg-muted/20' : 'bg-muted/50'}`}
                  >
                    <h5 className="font-medium text-sm">{notification.title}</h5>
                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No notifications yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
