
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopsList } from "./ShopsList";
import { ShopRegistrationForm } from "./ShopRegistrationForm";
import { AdminShopRegistration } from "./AdminShopRegistration";
import { useAuthCheck } from "../account/AccountInfo";

export const ShopManagementTab = () => {
  const { userRole } = useAuthCheck();
  const isAdmin = userRole === 'admin';

  return (
    <Tabs defaultValue="list" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="list">All Shops</TabsTrigger>
        <TabsTrigger value="register" disabled={!isAdmin}>
          {isAdmin ? "Admin Registration" : "Registration (Admin Only)"}
        </TabsTrigger>
        <TabsTrigger value="my-shop">My Shop</TabsTrigger>
      </TabsList>
      
      <TabsContent value="list">
        <ShopsList />
      </TabsContent>
      
      <TabsContent value="register">
        {isAdmin ? (
          <AdminShopRegistration />
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Only administrators can register new shops.
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="my-shop">
        <ShopRegistrationForm />
      </TabsContent>
    </Tabs>
  );
};
