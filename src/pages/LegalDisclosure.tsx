import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield, FileText, Lock, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from 'react-router-dom';

export const LegalDisclosure = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = location.state || {};

  useEffect(() => {
    // Load acceptance state from localStorage on component mount
    const storedTerms = localStorage.getItem('termsAccepted') === 'true';
    const storedPrivacy = localStorage.getItem('privacyAccepted') === 'true';
    setTermsAccepted(storedTerms);
    setPrivacyAccepted(storedPrivacy);
  }, []);

  const handleTermsChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
      setTermsAccepted(checked);
    }
  };

  const handlePrivacyChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
      setPrivacyAccepted(checked);
    }
  };

  const submitAcceptance = async () => {
    setIsSubmitting(true);
    try {
      // Store acceptance state in localStorage
      localStorage.setItem('termsAccepted', String(termsAccepted));
      localStorage.setItem('privacyAccepted', String(privacyAccepted));

      toast.success("Legal disclosures accepted!");
      navigate(`/track-job/${jobId}`);
    } catch (error) {
      console.error("Error submitting acceptance:", error);
      toast.error("Failed to submit acceptance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Legal Disclosure & Consent</h1>
              <p className="text-blue-100">Please review and accept our terms to continue</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Terms of Service Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 overflow-y-auto border rounded-md p-4 bg-gray-50">
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold">1. Service Agreement</h3>
                  <p>By using our motorcycle repair tracking service, you agree to be bound by these terms and conditions. Our service provides real-time updates on repair progress and facilitates communication between customers and repair shops.</p>
                  
                  <h3 className="font-semibold">2. Service Limitations</h3>
                  <p>While we strive to provide accurate and timely updates, repair timelines may vary due to parts availability, complexity of repairs, and shop workload. We are not responsible for delays beyond our control.</p>
                  
                  <h3 className="font-semibold">3. Payment and Billing</h3>
                  <p>All repair costs are determined by the service shop. Our platform may facilitate payment processing but does not set pricing. Final costs will be communicated before completion.</p>
                  
                  <h3 className="font-semibold">4. Liability</h3>
                  <p>Our liability is limited to the platform service itself. We are not responsible for the quality of repairs, parts used, or any damage that may occur during the repair process.</p>
                  
                  <h3 className="font-semibold">5. Termination</h3>
                  <p>Either party may terminate this agreement at any time. Upon termination, you will retain access to historical repair records for your reference.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={handleTermsChange}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have read and agree to the Terms of Service
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-600" />
                Privacy Policy & Data Collection Consent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 overflow-y-auto border rounded-md p-4 bg-gray-50">
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold">Data We Collect</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Contact information (email, phone number)</li>
                    <li>Vehicle information (make, model, year, license plate)</li>
                    <li>Service history and repair details</li>
                    <li>Communication logs between customer and shop</li>
                    <li>Location data for service pickup/delivery (if applicable)</li>
                  </ul>
                  
                  <h3 className="font-semibold">How We Use Your Data</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Provide repair tracking and status updates</li>
                    <li>Facilitate communication with service providers</li>
                    <li>Send notifications about your vehicle's service</li>
                    <li>Improve our service quality and user experience</li>
                    <li>Maintain service records for warranty purposes</li>
                  </ul>
                  
                  <h3 className="font-semibold">Data Sharing</h3>
                  <p>We share your data only with authorized repair shops working on your vehicle and trusted service providers who help us operate our platform. We never sell your personal information to third parties.</p>
                  
                  <h3 className="font-semibold">Data Security</h3>
                  <p>We use industry-standard security measures to protect your information, including encryption, secure servers, and access controls. However, no system is 100% secure.</p>
                  
                  <h3 className="font-semibold">Your Rights</h3>
                  <p>You can request to view, update, or delete your personal data at any time by contacting us. You may also opt out of non-essential communications.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={handlePrivacyChange}
                />
                <label
                  htmlFor="privacy"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I consent to the collection and use of my personal data as described
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAcceptance}
              disabled={!termsAccepted || !privacyAccepted || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept & Continue
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
