
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signIn, signUp } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface AuthFormProps {
  onLogin: (userData: any) => void;
}

// Sample user accounts for demo purposes
// In a real app, these would be stored securely in a backend database
const DEMO_USERS = [
  {
    email: "admin@projectport.com",
    password: "password123",
    name: "Admin User",
    verified: true
  },
  {
    email: "mechanic@projectport.com",
    password: "mechanic123",
    name: "Mechanic User",
    verified: true
  }
];

export const AuthForm = ({ onLogin }: AuthFormProps) => {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "mechanic" // Default role
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    // Clear any previous login error when the user starts typing
    setLoginError(null);
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: string) => {
    setSignupData({ ...signupData, role });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple validation
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        console.error("Login error:", error);
        setLoginError(error.message);
        toast.error(error.message || "Login failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }
      
      if (data.user) {
        toast.success("Login successful!");
        onLogin({ 
          email: data.user.email, 
          name: data.user.user_metadata?.name || data.user.email,
          role: data.user.user_metadata?.role || 'mechanic'
        });
      }
    } catch (error: any) {
      console.error("Login exception:", error);
      setLoginError(error.message || "An unexpected error occurred");
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple validation
    if (!signupData.name || !signupData.email || !signupData.password) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords don't match");
      setIsLoading(false);
      return;
    }
    
    try {
      const userData = {
        name: signupData.name,
        role: signupData.role
      };
      
      const { data, error } = await signUp(signupData.email, signupData.password, userData);
      
      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // For Supabase email verification flow
      toast.success("Registration successful! Please check your email for verification instructions.");
      setPendingUser({
        email: signupData.email,
        name: signupData.name,
        role: signupData.role
      });
      
      // For demo purposes, we'll also simulate a verification code
      setVerificationSent(true);
      
      // In a real app with Supabase, email verification is handled by Supabase
      // So this code is mainly for the demo flow
    } catch (error: any) {
      console.error("Signup exception:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In a real app, this would verify with Supabase
    // For demo, we'll just accept "123456" as the verification code
    if (verificationCode === "123456") {
      toast.success("Email verified successfully! You can now log in.");
      
      // Update the user's verification status
      if (pendingUser) {
        // In a real app, this would be done server-side by Supabase
        // For demo, we'll just simulate a login
        onLogin({ 
          email: pendingUser.email, 
          name: pendingUser.name,
          role: pendingUser.role
        });
      }
    } else {
      toast.error("Invalid verification code. Please try again.");
    }
    setIsLoading(false);
  };

  const handleResendVerification = () => {
    toast.success("Verification link resent. Please check your email.");
    // In a real app with Supabase, we would call the resend email API
  };

  if (verificationSent) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification code to {pendingUser?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  For demo purposes, use code: 123456
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive a code?
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleResendVerification}
              disabled={isLoading}
            >
              Resend Verification Code
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
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
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="mechanic@workshop.com"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                  />
                  {loginError && (
                    <p className="text-sm text-red-500 mt-1">{loginError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <div className="text-sm text-center text-muted-foreground">
                  <p>Demo credentials:</p>
                  <p>Email: admin@projectport.com</p>
                  <p>Password: password123</p>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Smith"
                    value={signupData.name}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="mechanic@workshop.com"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={signupData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="support">Support Staff</SelectItem>
                      <SelectItem value="mechanic">Mechanic</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Note: New accounts require approval by an administrator
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            For motorcycle mechanics and service centers
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
