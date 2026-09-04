import { Badge } from "@/components/ui/badge";
import {
  RESULT_STATUS_BADGE_VARIANT,
  RESULT_STATUS_LABELS,
  type SearchResultStatusValue,
} from "@/modules/lead-sourcing/constants";

export function ResultStatusBadge({ status }: { status: SearchResultStatusValue }) {
  return <Badge variant={RESULT_STATUS_BADGE_VARIANT[status]}>{RESULT_STATUS_LABELS[status]}</Badge>;
}
