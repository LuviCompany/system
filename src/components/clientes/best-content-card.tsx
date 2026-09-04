import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { SOCIAL_CONTENT_TYPE_LABELS } from "@/modules/clientes/constants";
import type { ContentRow } from "./content-table";

export function BestContentCard({ post }: { post: ContentRow | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand-500" aria-hidden />
          Melhor conteúdo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!post ? (
          <p className="text-sm text-ink-500">Sem conteúdos no período selecionado.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-xs text-ink-500">Conteúdo</dt>
              <dd className="font-medium text-ink-900">{post.caption ?? "Sem legenda"}</dd>
            </div>
            <div><dt className="text-xs text-ink-500">Tipo</dt><dd className="font-medium text-ink-900">{SOCIAL_CONTENT_TYPE_LABELS[post.type]}</dd></div>
            <div><dt className="text-xs text-ink-500">Data</dt><dd className="font-medium text-ink-900">{formatDate(post.publishedAt)}</dd></div>
            <div><dt className="text-xs text-ink-500">Alcance</dt><dd className="font-medium text-ink-900">{formatNumber(post.reach)}</dd></div>
            <div><dt className="text-xs text-ink-500">Interações</dt><dd className="font-medium text-ink-900">{formatNumber(post.engagement)}</dd></div>
            <div><dt className="text-xs text-ink-500">Taxa de engajamento</dt><dd className="font-medium text-ink-900">{formatPercent(post.engagementRate)}</dd></div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
