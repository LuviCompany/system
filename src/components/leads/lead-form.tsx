"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BRAZIL_STATES, LEAD_SOURCES, PIPELINE_STAGES } from "@/modules/leads/constants";
import type { ActionResult } from "@/server/leads/actions";
import type { LeadInput } from "@/server/leads/lead.schema";

export interface LeadFormValues {
  company: string;
  contactName: string;
  position: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  linkedin: string;
  city: string;
  state: string;
  segment: string;
  source: string;
  responsavelId: string;
  potentialValue: string;
  stage: string;
  notes: string;
  tagIds: string[];
  estimatedRevenue: string;
  adSpend: string;
  commercialMaturity: string;
  marketingNeed: string;
  technologyNeed: string;
  recurrencePotential: string;
}

const EMPTY_VALUES: LeadFormValues = {
  company: "",
  contactName: "",
  position: "",
  cnpj: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  instagram: "",
  linkedin: "",
  city: "",
  state: "",
  segment: "",
  source: "OUTRO",
  responsavelId: "",
  potentialValue: "",
  stage: "NOVOS",
  notes: "",
  tagIds: [],
  estimatedRevenue: "",
  adSpend: "",
  commercialMaturity: "",
  marketingNeed: "",
  technologyNeed: "",
  recurrencePotential: "",
};

interface LeadFormProps {
  availableTags: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
  initialValues?: Partial<LeadFormValues>;
  submitLabel?: string;
  onSubmit: (input: LeadInput) => Promise<ActionResult<{ id: string }> | ActionResult>;
  onSuccess: () => void;
  onCancel: () => void;
}

function RatingField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} ({value || 0})
      </Label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={value || 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-brand-500"
      />
    </div>
  );
}

export function LeadForm({
  availableTags,
  teamMembers,
  initialValues,
  submitLabel = "Salvar lead",
  onSubmit,
  onSuccess,
  onCancel,
}: LeadFormProps) {
  const [values, setValues] = useState<LeadFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTag(tagId: string) {
    setValues((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter((id) => id !== tagId) : [...prev.tagIds, tagId],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const input: LeadInput = {
      company: values.company,
      contactName: values.contactName || undefined,
      position: values.position || undefined,
      cnpj: values.cnpj || undefined,
      phone: values.phone || undefined,
      whatsapp: values.whatsapp || undefined,
      email: values.email || undefined,
      website: values.website || undefined,
      instagram: values.instagram || undefined,
      linkedin: values.linkedin || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      segment: values.segment || undefined,
      source: values.source as LeadInput["source"],
      responsavelId: values.responsavelId || undefined,
      potentialValue: values.potentialValue ? Number(values.potentialValue) : undefined,
      stage: values.stage as LeadInput["stage"],
      notes: values.notes || undefined,
      tagIds: values.tagIds,
      estimatedRevenue: values.estimatedRevenue ? Number(values.estimatedRevenue) : undefined,
      adSpend: values.adSpend ? Number(values.adSpend) : undefined,
      commercialMaturity: values.commercialMaturity ? Number(values.commercialMaturity) : undefined,
      marketingNeed: values.marketingNeed ? Number(values.marketingNeed) : undefined,
      technologyNeed: values.technologyNeed ? Number(values.technologyNeed) : undefined,
      recurrencePotential: values.recurrencePotential ? Number(values.recurrencePotential) : undefined,
    };

    try {
      const result = await onSubmit(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <DrawerBody className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Empresa</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="lead-company">Empresa *</Label>
              <Input id="lead-company" required value={values.company} onChange={(e) => update("company", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-cnpj">CNPJ</Label>
              <Input id="lead-cnpj" value={values.cnpj} onChange={(e) => update("cnpj", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-segment">Segmento</Label>
              <Input id="lead-segment" value={values.segment} onChange={(e) => update("segment", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-city">Cidade</Label>
              <Input id="lead-city" value={values.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-state">Estado</Label>
              <Select value={values.state} onValueChange={(value) => update("state", value)}>
                <SelectTrigger id="lead-state">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZIL_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="lead-website">Site</Label>
              <Input id="lead-website" value={values.website} onChange={(e) => update("website", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-instagram">Instagram</Label>
              <Input id="lead-instagram" value={values.instagram} onChange={(e) => update("instagram", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-linkedin">LinkedIn</Label>
              <Input id="lead-linkedin" value={values.linkedin} onChange={(e) => update("linkedin", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Contato</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-contact-name">Nome do contato</Label>
              <Input id="lead-contact-name" value={values.contactName} onChange={(e) => update("contactName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-position">Cargo</Label>
              <Input id="lead-position" value={values.position} onChange={(e) => update("position", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">Telefone</Label>
              <Input id="lead-phone" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-whatsapp">WhatsApp</Label>
              <Input id="lead-whatsapp" value={values.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="lead-email">E-mail</Label>
              <Input id="lead-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Comercial</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-source">Origem</Label>
              <Select value={values.source} onValueChange={(value) => update("source", value)}>
                <SelectTrigger id="lead-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-stage">Etapa do pipeline</Label>
              <Select value={values.stage} onValueChange={(value) => update("stage", value)}>
                <SelectTrigger id="lead-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-responsavel">Responsável</Label>
              <Select value={values.responsavelId} onValueChange={(value) => update("responsavelId", value)}>
                <SelectTrigger id="lead-responsavel">
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-potential-value">Valor potencial (R$/mês)</Label>
              <Input
                id="lead-potential-value"
                type="number"
                min={0}
                step="0.01"
                value={values.potentialValue}
                onChange={(e) => update("potentialValue", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Qualificação (usada pelo ICP Score)
          </h3>
          <p className="text-xs text-ink-500">
            Estes dados alimentam o cálculo automático do ICP Score deste lead — veja o resultado e a explicação no
            detalhe do lead após salvar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-estimated-revenue">Faturamento estimado (R$/mês)</Label>
              <Input
                id="lead-estimated-revenue"
                type="number"
                min={0}
                step="0.01"
                value={values.estimatedRevenue}
                onChange={(e) => update("estimatedRevenue", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-ad-spend">Investimento em tráfego (R$/mês)</Label>
              <Input
                id="lead-ad-spend"
                type="number"
                min={0}
                step="0.01"
                value={values.adSpend}
                onChange={(e) => update("adSpend", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <RatingField
              id="lead-commercial-maturity"
              label="Maturidade comercial"
              value={values.commercialMaturity}
              onChange={(v) => update("commercialMaturity", v)}
            />
            <RatingField
              id="lead-marketing-need"
              label="Necessidade de marketing"
              value={values.marketingNeed}
              onChange={(v) => update("marketingNeed", v)}
            />
            <RatingField
              id="lead-technology-need"
              label="Necessidade de tecnologia"
              value={values.technologyNeed}
              onChange={(v) => update("technologyNeed", v)}
            />
            <RatingField
              id="lead-recurrence-potential"
              label="Potencial de recorrência"
              value={values.recurrencePotential}
              onChange={(v) => update("recurrencePotential", v)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Tags</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {availableTags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox checked={values.tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} />
                {tag.name}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-1.5">
          <Label htmlFor="lead-notes">Observações</Label>
          <Textarea id="lead-notes" rows={3} value={values.notes} onChange={(e) => update("notes", e.target.value)} />
        </section>

        {error && (
          <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
            {error}
          </p>
        )}
      </DrawerBody>

      <DrawerFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
      </DrawerFooter>
    </form>
  );
}
