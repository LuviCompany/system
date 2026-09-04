"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { ScoreBadge } from "@/components/leads/score-badge";
import { TagList } from "@/components/leads/tag-list";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { PRIORITY_LABELS, type PriorityValue } from "@/modules/icp/constants";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/modules/leads/constants";
import type { LeadWithRelations } from "@/server/leads/lead.service";

const ALL = "ALL";

type SortKey = "recentes" | "score" | "valor" | "followup" | "criacao";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recentes", label: "Atualizados recentemente" },
  { value: "score", label: "ICP Score" },
  { value: "valor", label: "Valor potencial" },
  { value: "followup", label: "Próximo follow-up" },
  { value: "criacao", label: "Data de criação" },
];

function sortLeads(leads: LeadWithRelations[], sort: SortKey): LeadWithRelations[] {
  const list = [...leads];
  switch (sort) {
    case "score":
      return list.sort((a, b) => b.icpScore - a.icpScore);
    case "valor":
      return list.sort((a, b) => Number(b.potentialValue ?? 0) - Number(a.potentialValue ?? 0));
    case "followup":
      return list.sort((a, b) => {
        if (!a.nextFollowUpAt) return 1;
        if (!b.nextFollowUpAt) return -1;
        return new Date(a.nextFollowUpAt).getTime() - new Date(b.nextFollowUpAt).getTime();
      });
    case "criacao":
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

interface LeadsTableProps {
  leads: LeadWithRelations[];
  teamMembers: { id: string; name: string }[];
  availableTags: { id: string; name: string }[];
  currentUserId: string;
  defaultSort?: SortKey;
}

export function LeadsTable({ leads, teamMembers, availableTags, currentUserId, defaultSort = "recentes" }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState(ALL);
  const [responsavelId, setResponsavelId] = useState(ALL);
  const [priority, setPriority] = useState<PriorityValue | typeof ALL>(ALL);
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const searchParams = useSearchParams();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(() => searchParams.get("leadId"));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = leads.filter((lead) => {
      if (stage !== ALL && lead.stage !== stage) return false;
      if (responsavelId !== ALL && lead.responsavel?.id !== responsavelId) return false;
      if (priority !== ALL && lead.priority !== priority) return false;
      if (term) {
        const haystack = [lead.company, lead.contactName, lead.email, lead.cnpj, lead.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    return sortLeads(result, sort);
  }, [leads, search, stage, responsavelId, priority, sort]);

  const columns: DataTableColumn<LeadWithRelations>[] = [
    {
      key: "company",
      header: "Empresa",
      render: (lead) => (
        <div>
          <p className="font-medium text-ink-900">{lead.company}</p>
          <p className="text-xs text-ink-500">{lead.contactName ?? "Sem contato definido"}</p>
        </div>
      ),
    },
    { key: "segment", header: "Segmento", render: (lead) => lead.segment ?? "—" },
    { key: "source", header: "Origem", render: (lead) => <LeadSourceBadge source={lead.source} /> },
    { key: "stage", header: "Etapa", render: (lead) => PIPELINE_STAGE_LABELS[lead.stage] },
    { key: "score", header: "ICP Score", align: "right", render: (lead) => <ScoreBadge score={lead.icpScore} showLabel /> },
    {
      key: "value",
      header: "Valor potencial",
      align: "right",
      render: (lead) => (lead.potentialValue ? formatCurrency(Number(lead.potentialValue)) : "—"),
    },
    {
      key: "followup",
      header: "Próximo follow-up",
      render: (lead) => (lead.nextFollowUpAt ? formatDate(new Date(lead.nextFollowUpAt)) : "—"),
    },
    { key: "responsavel", header: "Responsável", render: (lead) => lead.responsavel?.name ?? "—" },
    { key: "tags", header: "Tags", render: (lead) => <TagList tags={lead.tags} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Buscar por empresa, contato, e-mail, CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar leads"
          />
        </div>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as etapas</SelectItem>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={responsavelId} onValueChange={setResponsavelId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os responsáveis</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
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
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={priority === "ALTA" ? "primary" : "outline"}
          size="sm"
          onClick={() => setPriority((prev) => (prev === "ALTA" ? ALL : "ALTA"))}
        >
          Só alta prioridade
        </Button>
      </div>

      <p className="text-xs text-ink-500">
        {filtered.length} lead{filtered.length === 1 ? "" : "s"} encontrado{filtered.length === 1 ? "" : "s"}
      </p>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(lead) => lead.id}
        emptyMessage="Nenhum lead encontrado com esses filtros."
        onRowClick={(lead) => setSelectedLeadId(lead.id)}
      />

      {selectedLeadId && (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          open={Boolean(selectedLeadId)}
          onOpenChange={(open) => !open && setSelectedLeadId(null)}
          availableTags={availableTags}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
