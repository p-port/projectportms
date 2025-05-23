
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStatusColor } from "../job-details/JobUtils";

interface JobCardProps {
  job: any;
  onViewDetails: (job: any) => void;
  translations: any;
}

export const JobCard = ({ job, onViewDetails, translations }: JobCardProps) => {
  return (
    <Card key={job.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.motorcycle.make} {job.motorcycle.model}</CardTitle>
            <CardDescription>{job.customer.name}</CardDescription>
          </div>
          <Badge className={`${getStatusColor(job.status)} capitalize`}>
            {job.status.replace("-", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{translations.jobId}</span>
            <span className="font-medium">{job.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{translations.service}</span>
            <span className="font-medium">{job.serviceType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{translations.created}</span>
            <span>{job.dateCreated}</span>
          </div>
          {job.dateCompleted && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{translations.completed}</span>
              <span>{job.dateCompleted}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{translations.notes}</span>
            <span>{job.notes.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{translations.photos}</span>
            <span>
              {job.photos.start.length + job.photos.completion.length} / 12
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onViewDetails(job)}
        >
          {translations.viewDetails || "View Details"}
        </Button>
      </CardFooter>
    </Card>
  );
};
