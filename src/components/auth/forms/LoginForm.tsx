
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { signIn, supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onLogin: (userData: any) => void;
}

// System admin credentials
const SYSTEM_ADMIN = {
  email: "admin@projectport.com",
  password: "admin123",
  name: "System Administrator",
  role: "admin"
};

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    // Clear any previous login error when the user starts typing
    setLoginError(null);
  };

  const createSystemAdminIfNeeded = async () => {
    // Check if using system admin credentials
    if (loginData.email === SYSTEM_ADMIN.email && loginData.password === SYSTEM_ADMIN.password) {
      try {
        // First check if admin account already exists
        const { data: existingUsers, error: lookupError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', SYSTEM_ADMIN.email)
          .limit(1);

        if (lookupError) {
          console.error("Error checking for system admin:", lookupError);
          return false;
        }

        if (existingUsers && existingUsers.length > 0) {
          // Admin already exists, proceed with normal login
          return false;
        }

        // Create system admin account
        const { error: signUpError, data } = await supabase.auth.signUp({
          email: SYSTEM_ADMIN.email,
          password: SYSTEM_ADMIN.password,
          options: {
            data: {
              name: SYSTEM_ADMIN.name,
              role: SYSTEM_ADMIN.role
            }
          }
        });

        if (signUpError) {
          console.error("Error creating system admin:", signUpError);
          return false;
        }

        // Ensure profile is created and approved
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name: SYSTEM_ADMIN.name,
              email: SYSTEM_ADMIN.email,
              role: SYSTEM_ADMIN.role,
              approved: true
            });

          if (profileError) {
            console.error("Error creating system admin profile:", profileError);
          }
        }

        toast.success("System admin account created successfully");
        return true;
      } catch (err) {
        console.error("Error in system admin creation:", err);
        return false;
      }
    }
    return false;
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
      // Check for system admin login
      const createdAdmin = await createSystemAdminIfNeeded();
      
      // Regular login flow
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
          role: data.user.user_metadata?.role || 'mechanic',
          id: data.user.id
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

  const loginAsAdmin = () => {
    setLoginData({
      email: SYSTEM_ADMIN.email,
      password: SYSTEM_ADMIN.password
    });
  };

  return (
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
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="remember-me" 
          checked={rememberMe} 
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
          Remember me
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
      
      <div className="pt-2 text-center">
        <button 
          type="button" 
          onClick={loginAsAdmin}
          className="text-xs text-primary hover:underline"
        >
          Login as System Admin
        </button>
      </div>
    </form>
  );
};
