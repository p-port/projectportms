
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopRegistrationForm } from "./ShopRegistrationForm";
import { ShopsList } from "./ShopsList";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ShopManagement() {
  const [activeTab, setActiveTab] = useState<"register" | "list">("list");
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Shop Management</h1>
          <p className="text-muted-foreground">
            Register and manage shops in the Project Port network.
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "register" | "list")}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Shop Directory
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Register Shop
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="register" className="m-0">
            <ShopRegistrationForm />
          </TabsContent>
          <TabsContent value="list" className="m-0">
            <ShopsList />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
