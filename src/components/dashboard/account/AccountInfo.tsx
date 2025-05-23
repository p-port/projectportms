import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Bell, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { RoleSwitcher } from "./RoleSwitcher";

interface AccountInfoProps {
  userId: string;
}

interface UserActivity {
  type: string;
  description: string;
  date: string;
}

const translations = {
  en: {
    accountInfo: "Account Information",
    accountDetails: "Your account details and permissions",
    recentActivity: "Recent Activity",
    activityDesc: "Your recent account activity and notifications",
    name: "Name",
    email: "Email",
    role: "Role",
    accountStatus: "Account Status",
    memberSince: "Member Since",
    accountActivity: "Account Activity",
    recentNotifications: "Recent Notifications",
    type: "Type",
    description: "Description",
    date: "Date",
    noActivity: "No activity recorded",
    noNotifications: "No notifications yet",
    notSpecified: "Not specified",
    approved: "Approved",
    pendingApproval: "Pending Approval",
    loading: "Loading account information...",
    error: "Error loading profile",
    retry: "Retry",
    adminTools: "Admin Tools",
    switchRole: "Switch Role",
    roleSwitchDescription: "This allows you to test the application with different permission levels.",
    roleSwitchSuccess: "Role switched successfully",
    roleSwitchError: "Failed to switch role",
    switching: "Switching..."
  },
  ko: {
    accountInfo: "계정 정보",
    accountDetails: "계정 세부정보 및 권한",
    recentActivity: "최근 활동",
    activityDesc: "최근 계정 활동 및 알림",
    name: "이름",
    email: "이메일",
    role: "역할",
    accountStatus: "계정 상태",
    memberSince: "가입일",
    accountActivity: "계정 활동",
    recentNotifications: "최근 알림",
    type: "유형",
    description: "설명",
    date: "날짜",
    noActivity: "기록된 활동 없음",
    noNotifications: "아직 알림 없음",
    notSpecified: "지정되지 않음",
    approved: "승인됨",
    pendingApproval: "승인 대기 중",
    loading: "계정 정보 로드 중...",
    error: "프로필 로드 중 오류 발생",
    retry: "재시도",
    adminTools: "관리자 도구",
    switchRole: "역할 전환",
    roleSwitchDescription: "다양한 권한 수준으로 응용 프로그램을 테스트할 수 있습니다.",
    roleSwitchSuccess: "역할이 성공적으로 전환되었습니다",
    roleSwitchError: "역할 전환 실패",
    switching: "전환 중..."
  }
};

export const AccountInfo = ({ userId }: AccountInfoProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [language] = useLocalStorage("language", "en");
  const t = translations[language as keyof typeof translations];

  const loadUserProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    
    try {
      // Get user profile from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        
        // Create a default profile if not found
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const defaultProfile = {
            id: userData.user.id,
            name: userData.user.user_metadata?.name || "User",
            email: userData.user.email,
            role: "mechanic",
            approved: true,
            created_at: userData.user.created_at
          };
          
          setUserProfile(defaultProfile);
        } else {
          throw profileError;
        }
      } else {
        setUserProfile(profileData);
      }

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
      const mockActivities = [
        {
          type: "account",
          description: "Account created",
          date: userProfile?.created_at || new Date().toISOString()
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
    } catch (error) {
      console.error('Error in account info:', error);
      setError(true);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId, language]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'support':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleRoleSwitch = (newRole: string) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, role: newRole });
      
      // Update activities to show the role switch
      const roleSwitchActivity = {
        type: "account",
        description: `Role switched to ${newRole}`,
        date: new Date().toISOString()
      };
      
      setActivities([roleSwitchActivity, ...activities]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <p className="text-destructive">{t.error}</p>
        <Button onClick={loadUserProfile} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t.retry}
        </Button>
      </div>
    );
  }

  // Check if this is a system admin account (for role switching)
  const isSystemAdmin = userProfile.email === "admin@projectport.com" || 
                        userProfile.name === "System Administrator";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t.accountInfo}
          </CardTitle>
          <CardDescription>
            {t.accountDetails}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">{t.name}</dt>
              <dd>{userProfile.name || t.notSpecified}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">{t.email}</dt>
              <dd>{userProfile.email || t.notSpecified}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">{t.role}</dt>
              <dd>
                <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                  {userProfile.role || 'User'}
                </Badge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">{t.accountStatus}</dt>
              <dd>
                <Badge variant={userProfile.approved ? "success" : "warning"}>
                  {userProfile.approved ? t.approved : t.pendingApproval}
                </Badge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">{t.memberSince}</dt>
              <dd>
                {userProfile.created_at ? format(new Date(userProfile.created_at), 'PPP') : 'N/A'}
              </dd>
            </div>
          </dl>

          {/* Add the RoleSwitcher component for system admin */}
          {(userProfile.role === 'admin' || isSystemAdmin) && (
            <div className="mt-6">
              <RoleSwitcher 
                userId={userId}
                currentRole={userProfile.role}
                isAdmin={true}
                onRoleSwitch={handleRoleSwitch}
                translations={t}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t.recentActivity}
          </CardTitle>
          <CardDescription>
            {t.activityDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t.accountActivity}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.type}</TableHead>
                  <TableHead>{t.description}</TableHead>
                  <TableHead>{t.date}</TableHead>
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
                    <TableCell colSpan={3} className="text-center">{t.noActivity}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <h4 className="text-sm font-medium mt-6">{t.recentNotifications}</h4>
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
                {t.noNotifications}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
