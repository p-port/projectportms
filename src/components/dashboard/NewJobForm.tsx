
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { generateJobId, generateTrackingId } from "@/utils/idGenerator";

interface NewJobFormProps {
  onJobCreated: () => void;
}

export const NewJobForm = ({ onJobCreated }: NewJobFormProps) => {
  const [formData, setFormData] = useState({
    // Customer information
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    
    // Motorcycle information
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    vin: "",
    engineNumber: "",
    plateNumber: "",
    
    // Service information
    serviceType: "",
    description: "",
    estimatedCost: "",
    
    // Legal acceptance
    termsAccepted: false,
    privacyAccepted: false
  });

  const [loading, setLoading] = useState(false);

  const serviceTypes = [
    "Oil Change",
    "Brake Service",
    "Engine Repair",
    "Transmission Service",
    "Electrical Repair",
    "Body Work",
    "Paint Job",
    "Tire Replacement",
    "Battery Replacement",
    "General Maintenance",
    "Inspection",
    "Custom Work",
    "Other"
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerEmail || !formData.serviceType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a job");
        return;
      }

      // Get user's shop ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single();

      const jobId = generateJobId();
      const trackingId = generateTrackingId();

      // Create the job
      const { error: jobError } = await supabase
        .from('jobs')
        .insert({
          job_id: jobId,
          user_id: user.id,
          shop_id: profile?.shop_id || null,
          service_type: formData.serviceType,
          status: 'pending',
          customer: {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone,
            trackingId: trackingId
          },
          motorcycle: {
            make: formData.make,
            model: formData.model,
            year: formData.year,
            color: formData.color,
            vin: formData.vin,
            engineNumber: formData.engineNumber,
            plateNumber: formData.plateNumber
          },
          notes: [{
            id: Date.now(),
            text: formData.description,
            timestamp: new Date().toISOString(),
            author: user.email || 'Unknown',
            estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null
          }]
        });

      if (jobError) {
        throw jobError;
      }

      // Store legal disclosure
      const { error: legalError } = await supabase
        .from('legal_disclosures')
        .insert({
          job_id: jobId,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          terms_accepted: formData.termsAccepted,
          privacy_accepted: formData.privacyAccepted,
          terms_accepted_at: formData.termsAccepted ? new Date().toISOString() : null,
          privacy_accepted_at: formData.privacyAccepted ? new Date().toISOString() : null
        });

      if (legalError) {
        console.error('Legal disclosure error:', legalError);
      }

      toast.success(`Job created successfully! Job ID: ${jobId}, Tracking ID: ${trackingId}`);
      
      // Reset form
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        color: "",
        vin: "",
        engineNumber: "",
        plateNumber: "",
        serviceType: "",
        description: "",
        estimatedCost: "",
        termsAccepted: false,
        privacyAccepted: false
      });

      // Trigger refresh of job list and navigate to active jobs
      onJobCreated();
      
      // Force a page reload to ensure the job appears in the list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error("Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-5 w-5" />
            Create New Service Job
          </CardTitle>
          <CardDescription className="text-base">
            Enter customer and motorcycle details to create a new service job
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information */}
            <div className="space-y-6">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold text-foreground">Customer Information</h3>
                <p className="text-sm text-muted-foreground mt-1">Basic customer contact details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm font-medium">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Enter customer name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    placeholder="customer@example.com"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    placeholder="+1234567890"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Motorcycle Information */}
            <div className="space-y-6">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold text-foreground">Motorcycle Information</h3>
                <p className="text-sm text-muted-foreground mt-1">Vehicle specifications and identification</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="make" className="text-sm font-medium">Make</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => handleInputChange("make", e.target.value)}
                    placeholder="Honda, Yamaha, etc."
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    placeholder="CBR600RR, YZF-R1, etc."
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-sm font-medium">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm font-medium">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="Red, Blue, etc."
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin" className="text-sm font-medium">VIN</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => handleInputChange("vin", e.target.value)}
                    placeholder="Vehicle Identification Number"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plateNumber" className="text-sm font-medium">License Plate</Label>
                  <Input
                    id="plateNumber"
                    value={formData.plateNumber}
                    onChange={(e) => handleInputChange("plateNumber", e.target.value)}
                    placeholder="ABC-1234"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Service Information */}
            <div className="space-y-6">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold text-foreground">Service Information</h3>
                <p className="text-sm text-muted-foreground mt-1">Service type and cost details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="serviceType" className="text-sm font-medium">Service Type *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost" className="text-sm font-medium">Estimated Cost</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => handleInputChange("estimatedCost", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Service Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the service needed or issues reported..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                type="submit" 
                disabled={loading} 
                className="min-w-[120px] h-10"
                size="default"
              >
                {loading ? "Creating Job..." : "Create Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
