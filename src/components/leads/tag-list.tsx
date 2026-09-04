import { Badge } from "@/components/ui/badge";

interface TagLike {
  tag: { id: string; name: string };
}

export function TagList({ tags, className }: { tags: TagLike[]; className?: string }) {
  if (tags.length === 0) return <span className="text-xs text-ink-400">—</span>;
  return (
    <div className={className ? className : "flex flex-wrap gap-1"}>
      {tags.map(({ tag }) => (
        <Badge key={tag.id} variant="neutral">
          {tag.name}
        </Badge>
      ))}
    </div>
  );
}
