
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopsList } from "./ShopsList";
import { AdminShopRegistration } from "./AdminShopRegistration";
import { MyShopView } from "./MyShopView";
import { ShopMemberManagement } from "./ShopMemberManagement";
import { useAuthCheck } from "@/hooks/useAuthCheck";

interface ShopManagementTabProps {
  userId?: string;
}

export const ShopManagementTab = ({ userId }: ShopManagementTabProps) => {
  const { userRole } = useAuthCheck();
  const isAdmin = userRole === 'admin';
  const isSupport = userRole === 'support';
  const canSeeAllShops = isAdmin || isSupport;

  return (
    <Tabs defaultValue={canSeeAllShops ? "list" : "my-shop"} className="space-y-6">
      <TabsList className={`grid w-full ${canSeeAllShops ? (isAdmin ? 'grid-cols-3' : 'grid-cols-2') : 'grid-cols-1'}`}>
        {canSeeAllShops && (
          <TabsTrigger value="list">All Shops</TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="register">
            Register Shop
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
        <MyShopView userId={userId} />
      </TabsContent>
    </Tabs>
  );
};
