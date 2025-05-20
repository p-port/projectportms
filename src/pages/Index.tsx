
import { useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/components/dashboard/Dashboard";

const Index = () => {
  // In a real application, this would be handled by an auth provider
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData: any) => {
    // Simulate login - in real app, this would validate with your backend
    setIsAuthenticated(true);
    setUser(userData);
  };

  return (
    <Layout>
      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} />
      )}
    </Layout>
  );
};

export default Index;
