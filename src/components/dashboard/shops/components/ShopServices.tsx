
import { Badge } from "@/components/ui/badge";
import { Shop } from "@/types/shop";

interface ShopServicesProps {
  shop: Shop;
}

export const ShopServices = ({ shop }: ShopServicesProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Services Offered</label>
      <div className="flex flex-wrap gap-1">
        {shop.services?.map((service, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {service}
          </Badge>
        ))}
      </div>
    </div>
  );
};
