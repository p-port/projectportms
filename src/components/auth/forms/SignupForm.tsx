
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { signUp } from "@/integrations/supabase/client";

interface SignupFormProps {
  onSignupSuccess: (pendingUser: any) => void;
}

export const SignupForm = ({ onSignupSuccess }: SignupFormProps) => {
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "mechanic" // Default role
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: string) => {
    setSignupData({ ...signupData, role });
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
      
      const pendingUser = {
        email: signupData.email,
        name: signupData.name,
        role: signupData.role
      };
      
      onSignupSuccess(pendingUser);
    } catch (error: any) {
      console.error("Signup exception:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
};
