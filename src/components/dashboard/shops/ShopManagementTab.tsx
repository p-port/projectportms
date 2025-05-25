
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopsList } from "./ShopsList";
import { ShopRegistrationForm } from "./ShopRegistrationForm";
import { AdminShopRegistration } from "./AdminShopRegistration";
import { useAuthCheck } from "@/hooks/useAuthCheck";

interface ShopManagementTabProps {
  userId?: string;
}

export const ShopManagementTab = ({ userId }: ShopManagementTabProps) => {
  const { userRole } = useAuthCheck();
  const isAdmin = userRole === 'admin';
  const isSupport = userRole === 'support';
  const canSeeAllShops = isAdmin || isSupport;

  // For non-admin/support users, they should only see their own shop
  const tabsToShow = canSeeAllShops 
    ? ["list", "register", "my-shop"]
    : ["my-shop"];

  return (
    <Tabs defaultValue={canSeeAllShops ? "list" : "my-shop"} className="space-y-6">
      <TabsList className={`grid w-full ${canSeeAllShops ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {canSeeAllShops && (
          <TabsTrigger value="list">All Shops</TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="register">
            Admin Registration
          </TabsTrigger>
        )}
        <TabsTrigger value="my-shop">My Shop</TabsTrigger>
      </TabsList>
      
      {canSeeAllShops && (
        <TabsContent value="list">
          <ShopsList />
        </TabsContent>
      )}
      
      {isAdmin && (
        <TabsContent value="register">
          <AdminShopRegistration />
        </TabsContent>
      )}
      
      <TabsContent value="my-shop">
        <ShopRegistrationForm />
      </TabsContent>
    </Tabs>
  );
};
