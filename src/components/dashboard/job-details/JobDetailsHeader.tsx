
import React from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { getStatusColor } from "./JobUtils";

interface JobDetailsHeaderProps {
  job: any;
  finalCost: string;
  setFinalCost: (cost: string) => void;
  onFinalCostSubmit: () => void;
  onDeleteClick: () => void;
  translations: any;
  deleteTranslations: any;
}

export const JobDetailsHeader = ({
  job,
  finalCost,
  setFinalCost,
  onFinalCostSubmit,
  onDeleteClick,
  translations,
  deleteTranslations,
}: JobDetailsHeaderProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>
            Job #{job.id} - {job.motorcycle.make}{" "}
            {job.motorcycle.model}
          </span>
          <Badge className={`${getStatusColor(job.status)} capitalize`}>
            {job.status.replace("-", " ")}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {translations.manageJob}
        </DialogDescription>
      </DialogHeader>

      <div className="my-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Label htmlFor="finalCost">{translations.finalCost}</Label>
          <div className="relative flex-1">
            <Input
              id="finalCost"
              type="text"
              placeholder={translations.enterFinalCost}
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
            />
          </div>
          <Button onClick={onFinalCostSubmit}>
            {translations.updateFinalCost}
          </Button>
        </div>
        
        <Button 
          variant="destructive" 
          className="ml-4"
          onClick={onDeleteClick}
        >
          <Trash2 className="mr-1" />
          {deleteTranslations.deleteJob}
        </Button>
      </div>
    </>
  );
};
