import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, CircleDashed } from "lucide-react";

interface StatusBadgeProps {
  status: "NEW" | "BILLED" | "FAILED";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm",
      status === "NEW" && "bg-blue-50 text-blue-700 border-blue-200",
      status === "BILLED" && "bg-green-50 text-green-700 border-green-200",
      status === "FAILED" && "bg-red-50 text-red-700 border-red-200"
    )}>
      {status === "NEW" && <CircleDashed className="h-3.5 w-3.5" />}
      {status === "BILLED" && <CheckCircle2 className="h-3.5 w-3.5" />}
      {status === "FAILED" && <AlertTriangle className="h-3.5 w-3.5" />}
      {status}
    </div>
  );
}
