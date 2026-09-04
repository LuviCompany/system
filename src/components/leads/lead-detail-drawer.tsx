"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { ScoreBadge } from "@/components/leads/score-badge";
import { ScoreExplanation } from "@/components/leads/score-explanation";
import { TagList } from "@/components/leads/tag-list";
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
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { ACTIVITY_TYPES, PIPELINE_STAGE_LABELS } from "@/modules/leads/constants";
import { createActivityAction } from "@/server/activities/actions";
import { createFollowUpAction } from "@/server/followups/actions";
import { getLeadDetailAction, updateLeadAction, type LeadDetail } from "@/server/leads/actions";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="text-sm text-ink-800">{value}</p>
    </div>
  );
}

interface LeadDetailDrawerProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableTags: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
  currentUserId: string;
}

export function LeadDetailDrawer({
  leadId,
  open,
  onOpenChange,
  availableTags,
  teamMembers,
  currentUserId,
}: LeadDetailDrawerProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [activityType, setActivityType] = useState<string>("NOTA");
  const [activityDescription, setActivityDescription] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getLeadDetailAction(leadId).then((result) => {
      if (cancelled) return;
      if (result.ok) setDetail(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  const loading = open && (!detail || detail.lead.id !== leadId);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setEditing(false);
    onOpenChange(nextOpen);
  }

  async function refresh() {
    const result = await getLeadDetailAction(leadId);
    if (result.ok) setDetail(result.data);
    router.refresh();
  }

  async function handleAddActivity(event: FormEvent) {
    event.preventDefault();
    if (!activityDescription.trim()) return;
    setSavingActivity(true);
    try {
      await createActivityAction({ leadId, type: activityType, description: activityDescription });
      setActivityDescription("");
      await refresh();
    } finally {
      setSavingActivity(false);
    }
  }

  async function handleAddFollowUp(event: FormEvent) {
    event.preventDefault();
    if (!followUpDate) return;
    setSavingFollowUp(true);
    try {
      await createFollowUpAction({
        leadId,
        scheduledAt: new Date(followUpDate).toISOString(),
        responsavelId: detail?.lead.responsavel?.id ?? currentUserId,
      });
      setFollowUpDate("");
      await refresh();
    } finally {
      setSavingFollowUp(false);
    }
  }

  const lead = detail?.lead;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        {loading || !lead ? (
          <LoadingState label="Carregando lead..." />
        ) : editing ? (
          <>
            <DrawerHeader>
              <DrawerTitle>Editar lead</DrawerTitle>
              <DrawerDescription>{lead.company}</DrawerDescription>
            </DrawerHeader>
            <LeadForm
              availableTags={availableTags}
              teamMembers={teamMembers}
              submitLabel="Salvar alterações"
              initialValues={{
                company: lead.company,
                contactName: lead.contactName ?? "",
                position: lead.position ?? "",
                cnpj: lead.cnpj ?? "",
                phone: lead.phone ?? "",
                whatsapp: lead.whatsapp ?? "",
                email: lead.email ?? "",
                website: lead.website ?? "",
                instagram: lead.instagram ?? "",
                linkedin: lead.linkedin ?? "",
                city: lead.city ?? "",
                state: lead.state ?? "",
                segment: lead.segment ?? "",
                source: lead.source,
                responsavelId: lead.responsavel?.id ?? "",
                potentialValue: lead.potentialValue ? String(lead.potentialValue) : "",
                stage: lead.stage,
                notes: lead.notes ?? "",
                tagIds: lead.tags.map((t) => t.tag.id),
                estimatedRevenue: lead.estimatedRevenue ? String(lead.estimatedRevenue) : "",
                adSpend: lead.adSpend ? String(lead.adSpend) : "",
                commercialMaturity: lead.commercialMaturity ? String(lead.commercialMaturity) : "",
                marketingNeed: lead.marketingNeed ? String(lead.marketingNeed) : "",
                technologyNeed: lead.technologyNeed ? String(lead.technologyNeed) : "",
                recurrencePotential: lead.recurrencePotential ? String(lead.recurrencePotential) : "",
              }}
              onSubmit={(input) => updateLeadAction(leadId, input)}
              onCancel={() => setEditing(false)}
              onSuccess={async () => {
                setEditing(false);
                await refresh();
              }}
            />
          </>
        ) : (
          <>
            <DrawerHeader>
              <div className="flex items-start justify-between gap-2 pr-8">
                <div>
                  <DrawerTitle>{lead.company}</DrawerTitle>
                  <DrawerDescription>
                    {lead.segment ?? "Sem segmento"} · {PIPELINE_STAGE_LABELS[lead.stage]}
                  </DrawerDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Editar
                </Button>
              </div>
            </DrawerHeader>

            <DrawerBody className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <ScoreBadge score={lead.icpScore} showLabel />
                <LeadSourceBadge source={lead.source} />
                <TagList tags={lead.tags} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Contato" value={lead.contactName} />
                <InfoRow label="Cargo" value={lead.position} />
                <InfoRow label="Telefone" value={lead.phone} />
                <InfoRow label="WhatsApp" value={lead.whatsapp} />
                <InfoRow label="E-mail" value={lead.email} />
                <InfoRow label="Site" value={lead.website} />
                <InfoRow label="Instagram" value={lead.instagram} />
                <InfoRow label="LinkedIn" value={lead.linkedin} />
                <InfoRow label="CNPJ" value={lead.cnpj} />
                <InfoRow label="Cidade/UF" value={lead.city ? `${lead.city}${lead.state ? `/${lead.state}` : ""}` : null} />
                <InfoRow
                  label="Valor potencial"
                  value={lead.potentialValue ? formatCurrency(Number(lead.potentialValue)) : null}
                />
                <InfoRow label="Responsável" value={lead.responsavel?.name} />
              </div>

              {lead.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Observações</p>
                  <p className="mt-1 text-sm text-ink-700">{lead.notes}</p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <ScoreExplanation score={lead.icpScore} factors={detail.scoreFactors} />
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-ink-900">Agendar follow-up</h3>
                <form onSubmit={handleAddFollowUp} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      aria-label="Data e hora do follow-up"
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={savingFollowUp || !followUpDate}>
                    Agendar
                  </Button>
                </form>
                {lead.nextFollowUpAt && (
                  <p className="mt-2 text-xs text-ink-500">
                    Próximo follow-up: {formatDate(new Date(lead.nextFollowUpAt))}
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-ink-900">Registrar atividade</h3>
                <form onSubmit={handleAddActivity} className="space-y-2">
                  <div className="flex gap-2">
                    <Select value={activityType} onValueChange={setActivityType}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      placeholder="Descreva a atividade..."
                      value={activityDescription}
                      onChange={(e) => setActivityDescription(e.target.value)}
                    />
                    <Button type="submit" disabled={savingActivity || !activityDescription.trim()}>
                      Adicionar
                    </Button>
                  </div>
                </form>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-ink-900">Histórico</h3>
                <ActivityTimeline activities={detail.activities} />
              </div>
            </DrawerBody>

            <DrawerFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
