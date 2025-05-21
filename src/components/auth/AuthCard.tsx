
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./forms/LoginForm";
import { SignupForm } from "./forms/SignupForm";

interface AuthCardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogin: (userData: any) => void;
  onSignupSuccess: (pendingUser: any) => void;
}

export const AuthCard = ({ 
  activeTab, 
  setActiveTab, 
  onLogin, 
  onSignupSuccess 
}: AuthCardProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Project Port</CardTitle>
        <CardDescription className="text-center">
          Motorcycle Service Management System
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm onLogin={onLogin} />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm onSignupSuccess={onSignupSuccess} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          For motorcycle mechanics and service centers
        </p>
      </CardFooter>
    </Card>
  );
};
