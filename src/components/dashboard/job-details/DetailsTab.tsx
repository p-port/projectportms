
import { Badge } from "@/components/ui/badge";

interface DetailsTabProps {
  currentJob: any;
}

export const DetailsTab = ({ currentJob }: DetailsTabProps) => {
  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Customer Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span>{currentJob.customer.name}</span>
            
            <span className="text-muted-foreground">Phone:</span>
            <span>{currentJob.customer.phone}</span>
            
            <span className="text-muted-foreground">Email:</span>
            <span>{currentJob.customer.email}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Motorcycle Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Make:</span>
            <span>{currentJob.motorcycle.make}</span>
            
            <span className="text-muted-foreground">Model:</span>
            <span>{currentJob.motorcycle.model}</span>
            
            <span className="text-muted-foreground">Year:</span>
            <span>{currentJob.motorcycle.year}</span>
            
            <span className="text-muted-foreground">VIN:</span>
            <span className="font-mono">{currentJob.motorcycle.vin}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">Service Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Service Type:</span>
            <span>{currentJob.serviceType}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">Created:</span>
            <span>{currentJob.dateCreated}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">Status:</span>
            <span className="capitalize">{currentJob.status.replace("-", " ")}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">Completed:</span>
            <span>{currentJob.dateCompleted || "Not completed"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
