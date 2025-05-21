
import { useState } from "react";
import { AuthCard } from "./AuthCard";
import { VerificationForm } from "./forms/VerificationForm";

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
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const handleSignupSuccess = (pendingUserData: any) => {
    setPendingUser(pendingUserData);
    setVerificationSent(true);
  };

  const handleVerificationSuccess = (userData: any) => {
    onLogin(userData);
  };

  if (verificationSent && pendingUser) {
    return (
      <VerificationForm 
        pendingUser={pendingUser} 
        onVerificationSuccess={handleVerificationSuccess} 
      />
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
      <AuthCard 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogin={onLogin} 
        onSignupSuccess={handleSignupSuccess} 
      />
    </div>
  );
};
