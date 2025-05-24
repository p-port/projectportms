import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Battery, Ticket, History, List, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface SearchPanelProps {
  jobs?: any[];
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
}

// ---- Utility constants and helpers ----

const TAB = {
  CUSTOMER: "customer",
  MOTORCYCLE: "motorcycle",
  JOB: "job"
} as const;

const normalizeName = (name: string) => name?.toLowerCase().trim() || "";

const safeDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

const censorName = (name: string) => {
  if (!name || name.length <= 2) return name;
  if (name.includes(" ")) {
    return name.split(" ").map(part => {
      if (part.length <= 2) return part;
      const firstChars = part.substring(0, 2);
      const lastChar = part.charAt(part.length - 1);
      const middle = '*'.repeat(Math.max(1, part.length - 3));
      return `${firstChars}${middle}${lastChar}`;
    }).join(" ");
  }
  if (name.length <= 3) return name;
  const firstChars = name.substring(0, 2);
  const lastChar = name.charAt(name.length - 1);
  const middle = '*'.repeat(Math.max(1, name.length - 3));
  return `${firstChars}${middle}${lastChar}`;
};

const JobPopoverButton = ({ job }: { job: any }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`View job ${job.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="font-medium">{job.motorcycle?.make} {job.motorcycle?.model}</h4>
                <p className="text-muted-foreground text-xs">Customer: {job.customer?.name || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <span className="text-muted-foreground">Service:</span>
                <span>{job.serviceType}</span>
                <span className="text-muted-foreground">Created:</span>
                <span>{job.dateCreated}</span>
                {job.status && <>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{job.status.replace("-", " ")}</span>
                </>}
                {job.dateCompleted && <>
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{job.dateCompleted}</span>
                </>}
              </div>
              {job.notes?.length > 0 && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium">Latest Note:</h5>
                  <p className="text-xs italic bg-muted p-2 rounded">
                    {job.notes[0].content?.substring(0, 100)}
                    {job.notes[0].content?.length > 100 ? "..." : ""}
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </TooltipTrigger>
      <TooltipContent>
        <p>View job summary</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
