
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye } from "lucide-react";
import { toast } from "sonner";

interface Shop {
  id: string;
  name: string;
  region: string;
  district: string;
  employee_count: number;
  services: string[];
  unique_identifier: string;
  created_at: string;
}

export function ShopsList() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setShops(data || []);
      } catch (error) {
        console.error("Error fetching shops:", error);
        toast.error("Could not load shops");
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const copyIdentifier = (identifier: string) => {
    navigator.clipboard.writeText(identifier);
    toast.success("Shop identifier copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Registered Shops</h2>
      {shops.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">No shops have been registered yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{shop.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {shop.region}, {shop.district}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Identifier</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm flex-1 overflow-hidden text-ellipsis">
                        {shop.unique_identifier}
                      </code>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => copyIdentifier(shop.unique_identifier)} 
                        title="Copy identifier"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Employees</div>
                    <div>{shop.employee_count}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Services</div>
                    <div className="flex flex-wrap gap-1">
                      {shop.services.map((service, idx) => (
                        <Badge key={idx} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
