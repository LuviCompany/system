"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ResultDetailDrawer } from "@/components/lead-sourcing/result-detail-drawer";
import { ResultStatusBadge } from "@/components/lead-sourcing/result-status-badge";
import { ScoreExplanationTrigger } from "@/components/lead-sourcing/score-explanation-trigger";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_BADGE_VARIANT, PRIORITY_LABELS, type PriorityValue } from "@/modules/icp/constants";
import { BRAZIL_STATES, type LeadSourceValue } from "@/modules/leads/constants";
import { addLeadSearchResultsToCrmAction, enrichLeadSearchResultAction } from "@/server/lead-sourcing/actions";
import type { LeadSearchResultForClient } from "@/server/lead-sourcing/search.service";

const ALL = "ALL";
type PresenceFilter = "ALL" | "SIM" | "NAO";
type SortKey = "score" | "priority" | "company" | "potential";

const PRIORITY_ORDER: Record<PriorityValue, number> = { MAXIMA: 3, ALTA: 2, MEDIA: 1, BAIXA: 0 };

function applyPresenceFilter(value: string | null, filter: PresenceFilter): boolean {
  if (filter === ALL) return true;
  return filter === "SIM" ? Boolean(value) : !value;
}

function leadSourceForProvider(providerId: string): LeadSourceValue {
  return providerId === "google_places" ? "GOOGLE_PLACES" : "BUSCA_EXTERNA";
}

function isEnriched(result: LeadSearchResultForClient): boolean {
  return Boolean(result.phone || result.website || result.sourceUrl);
}

interface SearchResultsTableProps {
  queryId: string;
  results: LeadSearchResultForClient[];
  providerId: string;
  providerLabel: string;
  onResultsUpdated: (updated: LeadSearchResultForClient[]) => void;
}

export function SearchResultsTable({ queryId, results, providerId, providerLabel, onResultsUpdated }: SearchResultsTableProps) {
  const router = useRouter();
  const sourceValue = leadSourceForProvider(providerId);
  const enrichable = providerId === "google_places";

  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState(ALL);
  const [priority, setPriority] = useState<PriorityValue | typeof ALL>(ALL);
  const [websiteFilter, setWebsiteFilter] = useState<PresenceFilter>(ALL);
  const [instagramFilter, setInstagramFilter] = useState<PresenceFilter>(ALL);
  const [phoneFilter, setPhoneFilter] = useState<PresenceFilter>(ALL);
  const [sort, setSort] = useState<SortKey>("score");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailResult, setDetailResult] = useState<LeadSearchResultForClient | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState<string | "bulk" | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [enriching, setEnriching] = useState<string | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = results.filter((result) => {
      if (segment && !result.segment?.toLowerCase().includes(segment.toLowerCase())) return false;
      if (city && !result.city?.toLowerCase().includes(city.toLowerCase())) return false;
      if (state !== ALL && result.state !== state) return false;
      if (priority !== ALL && result.priority !== priority) return false;
      if (!applyPresenceFilter(result.website, websiteFilter)) return false;
      if (!applyPresenceFilter(result.instagram, instagramFilter)) return false;
      if (!applyPresenceFilter(result.phone, phoneFilter)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === "company") return a.company.localeCompare(b.company);
      if (sort === "priority") return PRIORITY_ORDER[b.priority as PriorityValue] - PRIORITY_ORDER[a.priority as PriorityValue];
      if (sort === "potential") return (b.potentialValue ?? 0) - (a.potentialValue ?? 0);
      return b.icpScore - a.icpScore;
    });
  }, [results, segment, city, state, priority, websiteFilter, instagramFilter, phoneFilter, sort]);

  const selectableIds = useMemo(() => filtered.filter((r) => r.status !== "IMPORTED").map((r) => r.id), [filtered]);
  const allSelectableSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  function toggleSelectAll() {
    setSelectedIds(allSelectableSelected ? new Set() : new Set(selectableIds));
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedResults = useMemo(() => results.filter((r) => selectedIds.has(r.id)), [results, selectedIds]);
  const selectedDuplicates = selectedResults.filter((r) => r.status === "DUPLICATE").length;
  const selectedNew = selectedResults.length - selectedDuplicates;

  async function handleImport(ids: string[], mode: "bulk" | string) {
    setImporting(mode);
    setImportError(null);
    setImportMessage(null);
    try {
      const result = await addLeadSearchResultsToCrmAction({ queryId, resultIds: ids });
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      onResultsUpdated(result.data.updatedResults);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setConfirmOpen(false);
      const parts = [`${result.data.added} lead(s) adicionado(s) ao CRM`];
      if (result.data.duplicates > 0) parts.push(`${result.data.duplicates} já existia(m) e foi(ram) ignorado(s)`);
      if (result.data.errors > 0) parts.push(`${result.data.errors} falharam ao importar`);
      setImportMessage(parts.join(" — ") + ".");
      router.refresh();
    } finally {
      setImporting(null);
    }
  }

  async function handleEnrich(id: string) {
    setEnriching(id);
    setEnrichError(null);
    try {
      const result = await enrichLeadSearchResultAction(id);
      if (!result.ok) {
        setEnrichError(result.error);
        return;
      }
      onResultsUpdated([result.data]);
    } finally {
      setEnriching(null);
    }
  }

  const columns: DataTableColumn<LeadSearchResultForClient>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
      render: (result) => (
        <Checkbox
          checked={selectedIds.has(result.id)}
          disabled={result.status === "IMPORTED"}
          onChange={() => toggleRow(result.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Selecionar ${result.company}`}
        />
      ),
    },
    {
      key: "company",
      header: "Empresa",
      render: (result) => <p className="font-medium text-ink-900">{result.company}</p>,
    },
    { key: "type", header: "Tipo", render: (result) => result.type ?? result.segment ?? "—" },
    {
      key: "address",
      header: "Endereço",
      render: (result) => (
        <span className="block max-w-[220px] truncate" title={result.address ?? undefined}>
          {result.address ?? "Não encontrado"}
        </span>
      ),
    },
    { key: "city", header: "Cidade", render: (result) => result.city ?? "—" },
    { key: "state", header: "Estado", render: (result) => result.state ?? "—" },
    {
      key: "maps",
      header: "Google Maps",
      render: (result) =>
        result.sourceUrl ? (
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : (
          <span className="text-ink-400">Não encontrado</span>
        ),
    },
    { key: "origin", header: "Origem", render: () => <LeadSourceBadge source={sourceValue} /> },
    {
      key: "score",
      header: "ICP Score",
      align: "right",
      render: (result) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ScoreExplanationTrigger score={result.icpScore} factors={result.scoreFactors} companyName={result.company} showLabel={false} />
        </div>
      ),
    },
    {
      key: "priority",
      header: "Prioridade",
      render: (result) => (
        <Badge variant={PRIORITY_BADGE_VARIANT[result.priority as PriorityValue]}>
          {PRIORITY_LABELS[result.priority as PriorityValue]}
        </Badge>
      ),
    },
    { key: "status", header: "Status", render: (result) => <ResultStatusBadge status={result.status} /> },
    {
      key: "actions",
      header: "Ações",
      render: (result) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {enrichable && !isEnriched(result) && (
            <Button size="sm" variant="outline" onClick={() => handleEnrich(result.id)} disabled={enriching !== null}>
              {enriching === result.id ? "Enriquecendo..." : "Enriquecer"}
            </Button>
          )}
          {result.status === "NEW" && (
            <Button size="sm" onClick={() => handleImport([result.id], result.id)} disabled={importing !== null}>
              {importing === result.id ? "Adicionando..." : "Adicionar ao CRM"}
            </Button>
          )}
          {result.status === "DUPLICATE" && result.matchedLeadId && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/leads?leadId=${result.matchedLeadId}`}>Ver lead existente</Link>
            </Button>
          )}
          {result.status === "IMPORTED" && result.matchedLeadId && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/leads?leadId=${result.matchedLeadId}`}>Ver no CRM</Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setDetailResult(result)}>
            Ver detalhes
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Filtrar por segmento" value={segment} onChange={(e) => setSegment(e.target.value)} className="w-48" />
        <Input placeholder="Filtrar por cidade" value={city} onChange={(e) => setCity(e.target.value)} className="w-44" />
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os estados</SelectItem>
            {BRAZIL_STATES.map((uf) => (
              <SelectItem key={uf} value={uf}>
                {uf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(value) => setPriority(value as PriorityValue | typeof ALL)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as prioridades</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={websiteFilter} onValueChange={(value) => setWebsiteFilter(value as PresenceFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Website" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Website: todos</SelectItem>
            <SelectItem value="SIM">Com website</SelectItem>
            <SelectItem value="NAO">Sem website</SelectItem>
          </SelectContent>
        </Select>
        <Select value={instagramFilter} onValueChange={(value) => setInstagramFilter(value as PresenceFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Instagram" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Instagram: todos</SelectItem>
            <SelectItem value="SIM">Com Instagram</SelectItem>
            <SelectItem value="NAO">Sem Instagram</SelectItem>
          </SelectContent>
        </Select>
        <Select value={phoneFilter} onValueChange={(value) => setPhoneFilter(value as PresenceFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Telefone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Telefone: todos</SelectItem>
            <SelectItem value="SIM">Com telefone</SelectItem>
            <SelectItem value="NAO">Sem telefone</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Melhor ICP Score</SelectItem>
            <SelectItem value="priority">Prioridade</SelectItem>
            <SelectItem value="company">Empresa (A-Z)</SelectItem>
            <SelectItem value="potential">Potencial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <Checkbox checked={allSelectableSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" />
          <span>
            {filtered.length} empresa{filtered.length === 1 ? "" : "s"} encontrada{filtered.length === 1 ? "" : "s"} via{" "}
            {providerLabel}
          </span>
        </div>
        <Button
          type="button"
          disabled={selectedIds.size === 0 || importing !== null}
          onClick={() => setConfirmOpen(true)}
        >
          Adicionar selecionados ao CRM ({selectedIds.size})
        </Button>
      </div>

      {importError && (
        <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {importError}
        </p>
      )}
      {importMessage && <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-500">{importMessage}</p>}
      {enrichError && (
        <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {enrichError}
        </p>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(result) => result.id}
        emptyMessage="Nenhuma empresa encontrada com esses filtros."
        onRowClick={(result) => setDetailResult(result)}
      />

      <ResultDetailDrawer
        result={detailResult}
        open={Boolean(detailResult)}
        onOpenChange={(open) => !open && setDetailResult(null)}
        onAddToCrm={(id) => handleImport([id], id)}
        adding={importing === detailResult?.id}
        enrichable={enrichable}
        onEnrich={(id) => handleEnrich(id)}
        enriching={enriching === detailResult?.id}
      />

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Adicionar leads selecionados ao CRM</ModalTitle>
            <ModalDescription>Confira antes de confirmar — duplicados não serão adicionados novamente.</ModalDescription>
          </ModalHeader>
          <div className="space-y-2 rounded-lg border border-border bg-well p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Selecionados</span>
              <span className="font-mono font-semibold text-ink-900">{selectedResults.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Duplicados</span>
              <span className="font-mono font-semibold text-warning-600">{selectedDuplicates}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Novos</span>
              <span className="font-mono font-semibold text-success-600">{selectedNew}</span>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleImport([...selectedIds], "bulk")} disabled={importing !== null}>
              {importing === "bulk" ? "Adicionando..." : "Confirmar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
