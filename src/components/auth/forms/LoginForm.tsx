
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signIn } from "@/integrations/supabase/client";

interface LoginFormProps {
  onLogin: (userData: any) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    // Clear any previous login error when the user starts typing
    setLoginError(null);
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
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};
