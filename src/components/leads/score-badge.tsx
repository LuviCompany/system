import { Badge } from "@/components/ui/badge";
import { classifyScore, PRIORITY_BADGE_VARIANT, PRIORITY_LABELS } from "@/modules/icp/constants";

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ score, showLabel = false, className }: ScoreBadgeProps) {
  const priority = classifyScore(score);
  return (
    <Badge variant={PRIORITY_BADGE_VARIANT[priority]} className={className}>
      <span className="font-mono font-semibold">{score}</span>
      {showLabel && <span>{PRIORITY_LABELS[priority]}</span>}
    </Badge>
  );
}
