import { useState } from "react";
import { useAudiometryResults, useSyncBilling } from "@/hooks/use-audiometry";
import { CreateResultDialog } from "@/components/CreateResultDialog";
import { SyncLogsSheet } from "@/components/SyncLogsSheet";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { RefreshCw, Activity, History, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: results, isLoading, isError } = useAudiometryResults();
  const syncMutation = useSyncBilling();
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResults = results?.filter(r => 
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSync = (id: number) => {
    syncMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading records...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 bg-red-50">
        <p className="font-semibold">Failed to load dashboard data. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Audiometry Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage patient hearing test results and billing synchronization.
            </p>
          </div>
          <CreateResultDialog />
        </div>

        {/* Stats Overview (Optional Polish) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {results?.filter(r => r.status === "NEW").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed Syncs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {results?.filter(r => r.status === "FAILED").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="border shadow-md bg-white overflow-hidden">
          <CardHeader className="border-b bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>View and manage latest audiometry tests.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-[200px] pl-6">Patient Name</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Left Ear (dB)</TableHead>
                  <TableHead>Right Ear (dB)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No records found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResults?.map((result) => (
                    <TableRow key={result.id} className="group table-row-hover">
                      <TableCell className="font-medium pl-6 text-foreground">
                        {result.patientName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(result.testDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {result.leftEarDb} dB
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {result.rightEarDb} dB
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={result.status as any} />
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLogId(result.id)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span className="sr-only">View Logs</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={result.status === "BILLED" ? "outline" : "default"}
                          disabled={result.status === "BILLED" || syncMutation.isPending && syncMutation.variables === result.id}
                          onClick={() => handleSync(result.id)}
                          className={cn(
                            "w-24 transition-all duration-300",
                            result.status === "FAILED" && "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200"
                          )}
                        >
                          {syncMutation.isPending && syncMutation.variables === result.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : result.status === "FAILED" ? (
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          ) : null}
                          
                          {result.status === "FAILED" 
                            ? "Retry" 
                            : result.status === "BILLED" 
                              ? "Synced" 
                              : "Sync Billing"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

      </div>

      <SyncLogsSheet 
        id={selectedLogId} 
        patientName={results?.find(r => r.id === selectedLogId)?.patientName || ""}
        isOpen={!!selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />
    </div>
  );
}
