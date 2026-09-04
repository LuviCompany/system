import {
  CalendarClock,
  Camera,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  StickyNote,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ACTIVITY_TYPE_LABELS, type ActivityTypeValue } from "@/modules/leads/constants";

const ACTIVITY_ICONS: Record<ActivityTypeValue, LucideIcon> = {
  LIGACAO: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  INSTAGRAM: Camera,
  REUNIAO: Users,
  NOTA: StickyNote,
  FOLLOW_UP: CalendarClock,
  PROPOSTA: FileText,
};

export interface TimelineActivity {
  id: string;
  type: ActivityTypeValue;
  description: string;
  createdAt: Date | string;
  user: { name: string };
  lead?: { id: string; company: string };
}

function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
}

export function ActivityTimeline({ activities }: { activities: TimelineActivity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-ink-500">Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <ol className="space-y-4">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type];
        return (
          <li key={activity.id} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 border-b border-border pb-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink-900">{ACTIVITY_TYPE_LABELS[activity.type]}</p>
                <span className="shrink-0 text-xs text-ink-400">{formatDateTime(activity.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-sm text-ink-600">{activity.description}</p>
              <p className="mt-1 text-xs text-ink-400">
                por {activity.user.name}
                {activity.lead && <> · {activity.lead.company}</>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
