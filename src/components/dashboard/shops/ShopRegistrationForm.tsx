import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createShop } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { generateShopIdentifier } from "./ShopUtils";
import type { Shop } from "@/types/shop";

const shopFormSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  region: z.string().min(2, "Region must be at least 2 characters"),
  district: z.string().min(2, "District must be at least 2 characters"),
  employeeCount: z.coerce.number().min(1, "Employee count must be at least 1"),
  services: z.array(z.string()).min(1, "Select at least one service"),
});

type ShopFormValues = z.infer<typeof shopFormSchema>;

const availableServices = [
  { id: "maintenance", label: "Regular Maintenance" },
  { id: "repairs", label: "Repairs" },
  { id: "custom", label: "Custom Work" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "parts", label: "Parts Replacement" },
  { id: "tuning", label: "Performance Tuning" },
  { id: "electrical", label: "Electrical Work" },
  { id: "painting", label: "Painting & Bodywork" },
  { id: "tires", label: "Tire Service" },
  { id: "restoration", label: "Restoration" },
];

export function ShopRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: "",
      region: "",
      district: "",
      employeeCount: 1,
      services: [],
    },
  });

  const onSubmit = async (data: ShopFormValues) => {
    setIsSubmitting(true);
    try {
      // Generate a unique identifier for this shop
      const uniqueIdentifier = generateShopIdentifier(data.name, data.region);

      // Get current user's ID to set as owner
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        toast.error("You must be logged in to register a shop");
        setIsSubmitting(false);
        return;
      }

      const shopData = {
        name: data.name,
        region: data.region,
        district: data.district,
        employee_count: data.employeeCount,
        services: data.services,
        unique_identifier: uniqueIdentifier,
        owner_id: userId,
      };

      // Use the createShop utility function
      const { data: newShop, error } = await createShop(shopData);

      if (error) {
        console.error("Error creating shop:", error);
        toast.error("Failed to register shop: " + error.message);
      } else {
        toast.success("Shop registered successfully!");
        toast.info(`Your shop identifier is: ${uniqueIdentifier}`);
        form.reset();
      }
    } catch (error) {
      console.error("Error in shop registration:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register a New Shop</CardTitle>
        <CardDescription>
          Create a new shop in the Project Port network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter region" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter district" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="employeeCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Employees</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter employee count"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="services"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Services Offered</FormLabel>
                    <FormDescription>
                      Select all services your shop provides
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableServices.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="services"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, service.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== service.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {service.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register Shop"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
