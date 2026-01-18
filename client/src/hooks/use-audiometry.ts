import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertAudiometryResult, type AudiometryResultResponse, type BillingSyncLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useAudiometryResults() {
  return useQuery<AudiometryResultResponse[]>({
    queryKey: [api.audiometry.list.path],
    queryFn: async () => {
      const res = await fetch(api.audiometry.list.path);
      if (!res.ok) throw new Error("Failed to fetch results");
      return await res.json();
    },
  });
}

export function useCreateResult() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAudiometryResult) => {
      // Manual validation since we're using raw fetch in hooks, though Zod checks on backend
      const res = await fetch(api.audiometry.create.path, {
        method: api.audiometry.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create result");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.audiometry.list.path] });
      toast({
        title: "Success",
        description: "New patient result recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSyncBilling() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.audiometry.sync.path, { id });
      const res = await fetch(url, {
        method: api.audiometry.sync.method,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Sync failed");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.audiometry.list.path] });
      // Invalidate specific logs query too if we had one open
      queryClient.invalidateQueries({ queryKey: [api.audiometry.logs.path] });
      
      if (data.success) {
        toast({
          title: "Billing Synced",
          description: "Record successfully synced with billing provider.",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        toast({
          title: "Sync Warning",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSyncLogs(id: number, isOpen: boolean) {
  return useQuery<BillingSyncLog[]>({
    queryKey: [api.audiometry.logs.path, id],
    queryFn: async () => {
      const url = buildUrl(api.audiometry.logs.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return await res.json();
    },
    enabled: isOpen, // Only fetch when modal is open
  });
}
