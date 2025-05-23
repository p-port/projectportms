
import React from "react";
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

interface DeleteJobDialogProps {
  showFirstDialog: boolean;
  setShowFirstDialog: (show: boolean) => void;
  showSecondDialog: boolean;
  setShowSecondDialog: (show: boolean) => void;
  onDelete: () => void;
  translations: {
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    finalDeleteConfirmTitle: string;
    finalDeleteConfirmDescription: string;
    cancel: string;
    delete: string;
  };
}

export const DeleteJobDialog = ({
  showFirstDialog,
  setShowFirstDialog,
  showSecondDialog,
  setShowSecondDialog,
  onDelete,
  translations,
}: DeleteJobDialogProps) => {
  return (
    <>
      {/* First delete confirmation dialog */}
      <AlertDialog open={showFirstDialog} onOpenChange={setShowFirstDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowFirstDialog(false);
                setShowSecondDialog(true);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Second (final) delete confirmation dialog */}
      <AlertDialog open={showSecondDialog} onOpenChange={setShowSecondDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.finalDeleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.finalDeleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
