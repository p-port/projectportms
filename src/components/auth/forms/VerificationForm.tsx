
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface VerificationFormProps {
  pendingUser: {
    email: string;
    name: string;
    role: string;
  };
  onVerificationSuccess: (userData: any) => void;
}

export const VerificationForm = ({ pendingUser, onVerificationSuccess }: VerificationFormProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        onVerificationSuccess({ 
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
};
