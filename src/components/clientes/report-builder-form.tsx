"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPORT_METRIC_DEFS, REPORT_SECTION_DEFS } from "@/modules/clientes/constants";
import type { ReportInput } from "@/server/clients/report.schema";

interface SectionState {
  key: string;
  label: string;
  order: number;
  enabled: boolean;
}

interface MetricState {
  key: string;
  label: string;
  enabled: boolean;
}

export interface ReportFormValues {
  clientId: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  platforms: ("META_ADS" | "GOOGLE_ADS")[];
  sections: SectionState[];
  metrics: MetricState[];
}

function defaultSections(): SectionState[] {
  return REPORT_SECTION_DEFS.map((s, order) => ({ key: s.key, label: s.label, order, enabled: true }));
}

function defaultMetrics(): MetricState[] {
  return REPORT_METRIC_DEFS.map((m) => ({ key: m.key, label: m.label, enabled: true }));
}

function today(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const EMPTY_VALUES: ReportFormValues = {
  clientId: "",
  title: "",
  periodStart: today(-29),
  periodEnd: today(),
  platforms: ["META_ADS", "GOOGLE_ADS"],
  sections: defaultSections(),
  metrics: defaultMetrics(),
};

interface ReportBuilderFormProps {
  clients: { id: string; name: string; tradeName: string | null }[];
  initialValues?: Partial<ReportFormValues>;
  submitLabel?: string;
  onSubmit: (input: ReportInput) => Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }>;
}

export function ReportBuilderForm({ clients, initialValues, submitLabel = "Criar relatório", onSubmit }: ReportBuilderFormProps) {
  const [values, setValues] = useState<ReportFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function update<K extends keyof ReportFormValues>(key: K, value: ReportFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function togglePlatform(platform: "META_ADS" | "GOOGLE_ADS") {
    setValues((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform) ? prev.platforms.filter((p) => p !== platform) : [...prev.platforms, platform],
    }));
  }

  function toggleSection(key: string) {
    setValues((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s)),
    }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setValues((prev) => {
      const sections = [...prev.sections];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return prev;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections: sections.map((s, order) => ({ ...s, order })) };
    });
  }

  function toggleMetric(key: string) {
    setValues((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m)),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const input: ReportInput = {
      clientId: values.clientId,
      title: values.title,
      periodStart: new Date(values.periodStart),
      periodEnd: new Date(values.periodEnd),
      platforms: values.platforms,
      sections: values.sections.map((s) => ({ key: s.key as ReportInput["sections"][number]["key"], order: s.order, enabled: s.enabled })),
      metrics: values.metrics.map((m) => ({ key: m.key as ReportInput["metrics"][number]["key"], enabled: m.enabled })),
    };

    try {
      const result = await onSubmit(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/clientes/relatorios/${result.data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Configuração</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="report-client">Cliente *</Label>
            <Select value={values.clientId} onValueChange={(value) => update("clientId", value)}>
              <SelectTrigger id="report-client"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.tradeName ?? c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-title">Título *</Label>
            <Input id="report-title" required value={values.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-start">Início do período</Label>
            <Input id="report-start" type="date" value={values.periodStart} onChange={(e) => update("periodStart", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-end">Fim do período</Label>
            <Input id="report-end" type="date" value={values.periodEnd} onChange={(e) => update("periodEnd", e.target.value)} />
          </div>
          <div className="col-span-full space-y-1.5">
            <Label>Plataformas</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox checked={values.platforms.includes("META_ADS")} onChange={() => togglePlatform("META_ADS")} />
                Meta Ads
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox checked={values.platforms.includes("GOOGLE_ADS")} onChange={() => togglePlatform("GOOGLE_ADS")} />
                Google Ads
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Seções do relatório</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {values.sections.map((section, index) => (
            <div key={section.key} className="flex items-center justify-between rounded-md bg-well px-3 py-2">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox checked={section.enabled} onChange={() => toggleSection(section.key)} />
                {section.label}
              </label>
              <div className="flex gap-1">
                <button type="button" aria-label="Mover para cima" onClick={() => moveSection(index, -1)} className="rounded p-1 text-ink-400 hover:bg-surface-subtle disabled:opacity-30" disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Mover para baixo" onClick={() => moveSection(index, 1)} className="rounded p-1 text-ink-400 hover:bg-surface-subtle disabled:opacity-30" disabled={index === values.sections.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Métricas configuráveis</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {values.metrics.map((metric) => (
            <label key={metric.key} className="flex items-center gap-2 text-sm text-ink-700">
              <Checkbox checked={metric.enabled} onChange={() => toggleMetric(metric.key)} />
              {metric.label}
            </label>
          ))}
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/clientes/relatorios")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
