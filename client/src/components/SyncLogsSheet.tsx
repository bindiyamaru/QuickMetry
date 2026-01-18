import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSyncLogs } from "@/hooks/use-audiometry";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncLogsSheetProps {
  id: number | null;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SyncLogsSheet({ id, patientName, isOpen, onClose }: SyncLogsSheetProps) {
  const { data: logs, isLoading } = useSyncLogs(id || 0, isOpen);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Sync History</SheetTitle>
          <SheetDescription>
            Audit trail for patient: <span className="font-semibold text-foreground">{patientName}</span>
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Loading logs...
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-150px)] pr-4">
            <div className="space-y-4">
              {logs?.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                  No sync attempts recorded yet.
                </div>
              ) : (
                logs?.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "p-4 rounded-xl border flex items-start gap-4 transition-all",
                      log.status === "SUCCESS"
                        ? "bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900"
                        : "bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900"
                    )}
                  >
                    <div className="mt-1">
                      {log.status === "SUCCESS" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-semibold text-sm",
                          log.status === "SUCCESS" ? "text-green-700" : "text-red-700"
                        )}>
                          {log.status}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.createdAt && format(new Date(log.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      
                      {log.status === "FAILED" && (
                        <div className="text-sm mt-2">
                          <div className="flex items-center gap-2 text-red-800 font-medium text-xs uppercase tracking-wider mb-1">
                            <ShieldAlert className="h-3 w-3" />
                            {log.errorType} ERROR
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {log.errorMessage}
                          </p>
                          {log.retryCount !== null && log.retryCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Retry attempt #{log.retryCount}
                            </p>
                          )}
                        </div>
                      )}

                      {log.status === "SUCCESS" && (
                        <p className="text-sm text-muted-foreground">
                          Successfully synchronized with external billing provider.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
