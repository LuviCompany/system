import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Carregando...", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-ink-500", className)}
    >
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-ink-100", className)} aria-hidden />;
}
