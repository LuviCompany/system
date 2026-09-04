import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Algo deu errado",
  description = "Não foi possível carregar esses dados. Tente novamente.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-danger-500/20 bg-danger-50 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-500/10 text-danger-600">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
