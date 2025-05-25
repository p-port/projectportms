
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Home } from "lucide-react";
import { ShopInvitationHandler } from "../ShopInvitationHandler";

interface EmptyShopStateProps {
  userId?: string;
  userEmail: string;
  onNavigateHome: () => void;
}

export const EmptyShopState = ({ userId, userEmail, onNavigateHome }: EmptyShopStateProps) => {
  return (
    <div className="space-y-6">
      {userId && userEmail && (
        <ShopInvitationHandler userId={userId} userEmail={userEmail} />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              My Shop
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onNavigateHome}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
          <CardDescription>
            You are not currently assigned to any shop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please contact your administrator to be assigned to a shop.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
