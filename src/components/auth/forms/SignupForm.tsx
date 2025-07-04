import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signUp } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";

// Define the form schema with validation rules
const signUpFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["mechanic", "admin", "support"]),
  shopIdentifier: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

interface SignupFormProps {
  onSignupSuccess: (pendingUser: any) => void;
}

// Change to default export
export default function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize the form with react-hook-form
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "mechanic",
      shopIdentifier: "",
    },
  });
  
  // Get the current role value to conditionally render the shop identifier field
  const watchRole = form.watch("role");

  // Handle form submission
  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await signUp(
        values.email, 
        values.password, 
        { 
          name: values.name, 
          role: values.role,
          shop_identifier: values.shopIdentifier || undefined
        },
        `${window.location.origin}/verification-success`
      );
      
      if (error) {
        console.error("Sign up error:", error);
        toast.error(error.message);
      } else {
        // Wait for the user to be created and then assign to shop
        if (values.shopIdentifier && values.shopIdentifier.trim() !== '' && data?.user?.id) {
          try {
            // Use the RPC function to assign user to shop
            const { data: shopId, error: assignError } = await supabase.rpc(
              'assign_user_to_shop_by_identifier',
              {
                user_id: data.user.id,
                shop_identifier: values.shopIdentifier.trim()
              }
            );
            
            if (assignError) {
              console.error("Shop assignment error:", assignError);
              toast.warning("Account created but could not assign to shop. Please contact support.");
            } else if (shopId) {
              console.log("User successfully assigned to shop:", shopId);
              toast.success("Account created and assigned to shop successfully!");
            } else {
              console.log("Invalid shop identifier provided");
              toast.warning("Account created but shop identifier was invalid.");
            }
          } catch (err) {
            console.error("Error during shop assignment:", err);
            toast.warning("Account created but could not assign to shop. Please contact support.");
          }
        } else {
          toast.success("Signup successful! Please check your email to verify your account.");
        }
        
        onSignupSuccess(data);
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Create a secure password" 
                  {...field} 
                  disabled={isLoading} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-2"
                  disabled={isLoading}
                >
                  <FormItem className="flex items-center space-x-1 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="mechanic" />
                    </FormControl>
                    <FormLabel className="font-normal">Mechanic</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-1 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="admin" />
                    </FormControl>
                    <FormLabel className="font-normal">Admin</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-1 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="support" />
                    </FormControl>
                    <FormLabel className="font-normal">Support</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(watchRole === "mechanic") && (
          <FormField
            control={form.control}
            name="shopIdentifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shop Identifier</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your shop's unique identifier" 
                    {...field} 
                    disabled={isLoading} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
