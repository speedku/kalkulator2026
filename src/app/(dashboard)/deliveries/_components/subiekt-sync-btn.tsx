"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { syncDeliveriesAction } from "@/lib/actions/domestic-deliveries";

export function SubiektSyncBtn() {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncDeliveriesAction();
      if (result.success) {
        toast.success(result.success);
      } else if (result.error) {
        if (result.discovered) {
          // Configuration needed, not a failure
          toast.info(result.error, { duration: 8000 });
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Synchronizuję..." : "Synchronizuj z Subiekt GT"}
    </button>
  );
}
