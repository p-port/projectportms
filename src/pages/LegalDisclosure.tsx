
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Shield, ArrowRight } from "lucide-react";

export const LegalDisclosure = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get customer info from URL params or localStorage if available
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const phone = urlParams.get('phone');
    
    if (email) setCustomerEmail(email);
    if (phone) setCustomerPhone(phone);
  }, []);

  const handleAcceptTerms = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the Terms of Service to continue");
      return;
    }

    try {
      setLoading(true);
      
      // Record terms acceptance
      const { error } = await supabase
        .from('legal_disclosures')
        .upsert({
          customer_email: customerEmail,
          customer_phone: customerPhone,
          job_id: jobId,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      setCurrentStep(2);
    } catch (error) {
      console.error("Error recording terms acceptance:", error);
      toast.error("Failed to record acceptance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPrivacy = async () => {
    if (!privacyAccepted) {
      toast.error("Please accept the Privacy Policy to continue");
      return;
    }

    try {
      setLoading(true);
      
      // Record privacy acceptance
      const { error } = await supabase
        .from('legal_disclosures')
        .update({
          privacy_accepted: true,
          privacy_accepted_at: new Date().toISOString()
        })
        .eq('customer_email', customerEmail)
        .eq('job_id', jobId);

      if (error) throw error;

      toast.success("Legal disclosures completed");
      
      // Redirect to job tracking page
      if (jobId) {
        navigate(`/track-job/${jobId}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Error recording privacy acceptance:", error);
      toast.error("Failed to record acceptance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">
              Please review and accept our terms of service to continue
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-4">Motorcycle Service Terms</h3>
              <div className="space-y-4 text-sm">
                <p>
                  By using our motorcycle service platform, you agree to the following terms:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>All service work is performed by certified mechanics</li>
                  <li>Estimated completion times are approximate and may vary</li>
                  <li>Payment is due upon completion of service</li>
                  <li>We are not responsible for pre-existing damage not disclosed</li>
                  <li>All parts and labor come with our standard warranty</li>
                  <li>Additional work may be required and will be communicated before proceeding</li>
                </ul>
                <p>
                  These terms are subject to change. Continued use of our services implies acceptance of any modifications.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={setTermsAccepted}
              />
              <label htmlFor="terms" className="text-sm font-medium">
                I have read and accept the Terms of Service
              </label>
            </div>
            
            <Button 
              onClick={handleAcceptTerms} 
              disabled={!termsAccepted || loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Accept Terms"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">
            Your privacy and data protection are important to us
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-4">Data Collection and Usage</h3>
            <div className="space-y-4 text-sm">
              <p>
                We collect and use your personal information to provide motorcycle repair services:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Contact information for service updates and communication</li>
                <li>Vehicle information for proper service delivery</li>
                <li>Service history for warranty and future reference</li>
                <li>Payment information for transaction processing</li>
                <li>Photos of your motorcycle for documentation purposes</li>
              </ul>
              <h4 className="font-semibold mt-4">Data Protection</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Your data is stored securely and encrypted</li>
                <li>We do not share your information with third parties without consent</li>
                <li>You can request data deletion at any time</li>
                <li>We comply with local data protection regulations</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={setPrivacyAccepted}
            />
            <label htmlFor="privacy" className="text-sm font-medium">
              I consent to the collection and use of my personal data as described
            </label>
          </div>
          
          <Button 
            onClick={handleAcceptPrivacy} 
            disabled={!privacyAccepted || loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Accept Privacy Policy"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
