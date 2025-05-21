
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
    confirmPassword: ""
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    // Clear any previous login error when the user starts typing
    setLoginError(null);
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    // Check against demo users
    const user = DEMO_USERS.find(
      user => user.email === loginData.email && user.password === loginData.password
    );
    
    if (user) {
      if (user.verified) {
        toast.success("Login successful!");
        onLogin({ email: user.email, name: user.name });
      } else {
        toast.error("Please verify your email address before logging in.");
        // Show verification UI
        setVerificationSent(true);
        setPendingUser(user);
      }
    } else {
      setLoginError("Invalid email or password");
      toast.error("Login failed. Please check your credentials.");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!signupData.name || !signupData.email || !signupData.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    // Check if email already exists
    if (DEMO_USERS.some(user => user.email === signupData.email)) {
      toast.error("Email already registered");
      return;
    }
    
    // In a real app, we would register the user in a database
    const newUser = {
      email: signupData.email,
      password: signupData.password,
      name: signupData.name,
      verified: false
    };
    
    // Simulate sending a verification email
    setPendingUser(newUser);
    setVerificationSent(true);
    toast.success("A verification link has been sent to your email address.");
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we would verify the code
    // For demo, we'll just accept "123456" as the verification code
    if (verificationCode === "123456") {
      // In a real app, we would update the user in the database
      toast.success("Email verified successfully! You can now log in.");
      
      // Update the user's verification status
      if (pendingUser) {
        const updatedUser = { ...pendingUser, verified: true };
        // In a real app, we would update the database
        // For demo, we'll just simulate a login
        onLogin({ email: updatedUser.email, name: updatedUser.name });
      }
    } else {
      toast.error("Invalid verification code. Please try again.");
    }
  };

  const handleResendVerification = () => {
    // In a real app, we would resend the verification email
    toast.success("Verification link resent. Please check your email.");
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
              <Button type="submit" className="w-full">Verify Email</Button>
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
                <Button type="submit" className="w-full">Login</Button>
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
                <Button type="submit" className="w-full">Create Account</Button>
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
