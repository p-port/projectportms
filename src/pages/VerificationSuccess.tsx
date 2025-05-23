
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/use-local-storage";

const translations = {
  en: {
    verificationSuccess: "Email Verification Successful",
    description: "Your email has been successfully verified.",
    accountActivated: "Your account has been activated.",
    redirecting: "You will be redirected to the login page in a few seconds.",
    goToLogin: "Go to Login",
    verifying: "Verifying your email...",
    pleaseWait: "Please wait while we verify your email address."
  },
  ko: {
    verificationSuccess: "이메일 인증 성공",
    description: "이메일이 성공적으로 인증되었습니다.",
    accountActivated: "계정이 활성화되었습니다.",
    redirecting: "몇 초 후에 로그인 페이지로 이동합니다.",
    goToLogin: "로그인으로 이동",
    verifying: "이메일 인증 중...",
    pleaseWait: "이메일 주소를 확인하는 동안 잠시 기다려주세요."
  }
};

const VerificationSuccess = () => {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [language] = useLocalStorage("language", "en");
  const navigate = useNavigate();
  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    // Check for access_token in URL to determine if verification was successful
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");

    const verifySession = async () => {
      if (accessToken) {
        try {
          // If there's an access token, verification was successful
          setVerified(true);
          
          // After 3 seconds, redirect to login
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } catch (error) {
          console.error("Error during verification:", error);
          setVerified(false);
        }
      } else {
        // No access token found, might not be a verification link
        setVerified(false);
      }
    };

    verifySession();
  }, [navigate]);

  const handleGoToLogin = () => {
    navigate("/");
  };

  if (verified === null) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                {t.verifying}
              </CardTitle>
              <CardDescription className="text-center">
                {t.pleaseWait}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {t.verificationSuccess}
            </CardTitle>
            <CardDescription className="text-center">
              {t.description}
              <br />
              {t.accountActivated}
              <br />
              {t.redirecting}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <Button onClick={handleGoToLogin}>{t.goToLogin}</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default VerificationSuccess;
