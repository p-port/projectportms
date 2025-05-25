
import { Badge } from "@/components/ui/badge";

interface ShopOwnerInfoProps {
  shopOwner: any;
}

export const ShopOwnerInfo = ({ shopOwner }: ShopOwnerInfoProps) => {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Shop Owner</h4>
      {shopOwner ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Owner</Badge>
          <span>{shopOwner.name}</span>
          <span className="text-muted-foreground">({shopOwner.email})</span>
        </div>
      ) : (
        <p className="text-muted-foreground">No owner assigned</p>
      )}
    </div>
  );
};
