
import React from "react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FinalCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalCost: string;
  setFinalCost: (cost: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  translations: {
    enterFinalCostTitle: string;
    enterFinalCostDescription: string;
    enterFinalCost: string;
    cancel: string;
    save: string;
  };
}

export const FinalCostDialog = ({
  open,
  onOpenChange,
  finalCost,
  setFinalCost,
  onSubmit,
  onCancel,
  translations,
}: FinalCostDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{translations.enterFinalCostTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {translations.enterFinalCostDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            type="text"
            placeholder={translations.enterFinalCost}
            value={finalCost}
            onChange={(e) => setFinalCost(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{translations.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit}>{translations.save}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
