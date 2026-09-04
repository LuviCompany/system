"use client";

import Link from "next/link";
import { Check, ExternalLink, X as XIcon } from "lucide-react";

import { ResultStatusBadge } from "@/components/lead-sourcing/result-status-badge";
import { ScoreExplanation } from "@/components/leads/score-explanation";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCurrency } from "@/lib/format";
import type { LeadSearchResultForClient } from "@/server/lead-sourcing/search.service";

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-500">{label}</span>
      {value ? (
        <span className="flex items-center gap-1.5 text-ink-800">
          <Check className="h-3.5 w-3.5 text-success-500" aria-hidden />
          {value}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-ink-400">
          <XIcon className="h-3.5 w-3.5" aria-hidden />
          Não encontrado
        </span>
      )}
    </div>
  );
}

function isEnriched(result: LeadSearchResultForClient): boolean {
  return Boolean(result.phone || result.website || result.sourceUrl);
}

interface ResultDetailDrawerProps {
  result: LeadSearchResultForClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCrm: (resultId: string) => void;
  adding: boolean;
  enrichable: boolean;
  onEnrich: (resultId: string) => void;
  enriching: boolean;
}

export function ResultDetailDrawer({
  result,
  open,
  onOpenChange,
  onAddToCrm,
  adding,
  enrichable,
  onEnrich,
  enriching,
}: ResultDetailDrawerProps) {
  if (!result) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2">
            <DrawerTitle>{result.company}</DrawerTitle>
            <ResultStatusBadge status={result.status} />
          </div>
          <DrawerDescription>{result.type ?? result.segment ?? "Segmento não informado"}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-900">Explicação do score</h3>
            <ScoreExplanation score={result.icpScore} factors={result.scoreFactors} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-900">Dados encontrados</h3>
              {enrichable && !isEnriched(result) && (
                <Button size="sm" variant="outline" onClick={() => onEnrich(result.id)} disabled={enriching}>
                  {enriching ? "Enriquecendo..." : "Enriquecer"}
                </Button>
              )}
            </div>
            <div className="rounded-lg border border-border bg-well px-3">
              <Field label="Endereço" value={result.address} />
              <Field label="Cidade / Estado" value={[result.city, result.state].filter(Boolean).join(" / ") || null} />
              <Field label="Telefone" value={result.phone} />
              <Field label="Website" value={result.website} />
              <Field label="Instagram" value={result.instagram} />
              <Field label="LinkedIn" value={result.linkedin} />
              <Field label="E-mail" value={result.email} />
              <Field label="CNPJ" value={result.cnpj} />
              <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                <span className="text-ink-500">Google Maps</span>
                {result.sourceUrl ? (
                  <a
                    href={result.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-500 hover:underline"
                  >
                    Abrir <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-ink-400">
                    <XIcon className="h-3.5 w-3.5" aria-hidden />
                    Não encontrado
                  </span>
                )}
              </div>
              <Field label="Avaliação" value={result.rating !== null ? `${result.rating.toFixed(1)} / 5` : null} />
              <Field label="Número de avaliações" value={result.userRatingCount} />
              <Field label="Funcionários" value={result.raw.employees} />
              <Field
                label="Faturamento estimado"
                value={result.estimatedRevenue !== null ? formatCurrency(result.estimatedRevenue) : null}
              />
              <Field
                label="Investimento em tráfego"
                value={result.adSpend !== null ? formatCurrency(result.adSpend) : null}
              />
              <Field
                label="Stack de tecnologia"
                value={result.raw.technologyStack && result.raw.technologyStack.length > 0 ? result.raw.technologyStack.join(", ") : null}
              />
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter>
          {result.status === "DUPLICATE" && result.matchedLeadId ? (
            <Button asChild variant="outline">
              <Link href={`/leads?leadId=${result.matchedLeadId}`}>Ver lead existente</Link>
            </Button>
          ) : result.status === "IMPORTED" && result.matchedLeadId ? (
            <Button asChild variant="outline">
              <Link href={`/leads?leadId=${result.matchedLeadId}`}>Ver no CRM</Link>
            </Button>
          ) : (
            <Button onClick={() => onAddToCrm(result.id)} disabled={adding}>
              {adding ? "Adicionando..." : "Adicionar ao CRM"}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
