"use client";

import { ChevronDown, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { CriterionRulesEditor, type RuleState } from "@/components/icp/criterion-rules-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_RULE_TEMPLATES,
  ICP_CRITERIA,
  ICP_CRITERION_KIND,
  type IcpCriterionTypeValue,
} from "@/modules/icp/constants";
import { activateIcpProfileAction, createIcpProfileAction, updateIcpProfileAction } from "@/server/icp/actions";
import type { IcpProfileForClient } from "@/server/icp/icp.service";

interface CriterionState {
  type: IcpCriterionTypeValue;
  weight: number;
  rules: RuleState[];
}

function ruleToState(rule: { label: string; order: number; minValue: unknown; maxValue: unknown; matchValues: string[]; score: number }): RuleState {
  return {
    key: crypto.randomUUID(),
    label: rule.label,
    min: rule.minValue !== null && rule.minValue !== undefined ? String(rule.minValue) : "",
    max: rule.maxValue !== null && rule.maxValue !== undefined ? String(rule.maxValue) : "",
    matchValues: rule.matchValues.join(", "),
    score: String(rule.score),
  };
}

function templateToState(type: IcpCriterionTypeValue): RuleState[] {
  const template = DEFAULT_RULE_TEMPLATES[type];
  if (!template) return [];
  return template.map((tier) => ({
    key: crypto.randomUUID(),
    label: tier.label,
    min: tier.min !== null ? String(tier.min) : "",
    max: tier.max !== null ? String(tier.max) : "",
    matchValues: "",
    score: String(tier.score),
  }));
}

function buildInitialCriteria(profile: IcpProfileForClient | null): Record<IcpCriterionTypeValue, CriterionState> {
  const byType = new Map(profile?.criteria.map((c) => [c.type as IcpCriterionTypeValue, c]) ?? []);
  const result = {} as Record<IcpCriterionTypeValue, CriterionState>;
  for (const meta of ICP_CRITERIA) {
    const existing = byType.get(meta.value);
    result[meta.value] = {
      type: meta.value,
      weight: existing?.weight ?? 0,
      rules: existing ? existing.rules.map(ruleToState) : [],
    };
  }
  return result;
}

interface IcpProfileEditorProps {
  profile: IcpProfileForClient | null;
  onCreated?: (id: string) => void;
}

export function IcpProfileEditor({ profile, onCreated }: IcpProfileEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [criteria, setCriteria] = useState<Record<IcpCriterionTypeValue, CriterionState>>(() =>
    buildInitialCriteria(profile),
  );
  const [expanded, setExpanded] = useState<Set<IcpCriterionTypeValue>>(
    () => new Set(ICP_CRITERIA.filter((c) => (criteria[c.value]?.weight ?? 0) > 0).map((c) => c.value)),
  );
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const weightTotal = ICP_CRITERIA.reduce((sum, c) => sum + (criteria[c.value]?.weight ?? 0), 0);
  const configuredCount = ICP_CRITERIA.filter((c) => (criteria[c.value]?.weight ?? 0) > 0).length;

  function updateCriterion(type: IcpCriterionTypeValue, patch: Partial<CriterionState>) {
    setCriteria((prev) => {
      const current = prev[type];
      const next = { ...current, ...patch };
      // Ao ligar um critério numérico pela primeira vez, sugere faixas padrão.
      if (patch.weight !== undefined && patch.weight > 0 && current.weight === 0 && current.rules.length === 0) {
        next.rules = templateToState(type);
      }
      return { ...prev, [type]: next };
    });
  }

  function toggleExpanded(type: IcpCriterionTypeValue) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function buildPayload() {
    return {
      name,
      description,
      criteria: ICP_CRITERIA.filter((c) => criteria[c.value].weight > 0).map((c) => {
        const state = criteria[c.value];
        const kind = ICP_CRITERION_KIND[c.value];
        return {
          type: c.value,
          weight: state.weight,
          rules:
            kind === "boolean"
              ? []
              : state.rules.map((rule, index) => ({
                  label: rule.label || `Faixa ${index + 1}`,
                  order: index,
                  minValue: kind === "numeric" && rule.min !== "" ? Number(rule.min) : null,
                  maxValue: kind === "numeric" && rule.max !== "" ? Number(rule.max) : null,
                  matchValues:
                    kind === "categorical"
                      ? rule.matchValues.split(",").map((v) => v.trim()).filter(Boolean)
                      : [],
                  score: Number(rule.score) || 0,
                })),
        };
      }),
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildPayload();
      const result = profile
        ? await updateIcpProfileAction(profile.id, payload)
        : await createIcpProfileAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Perfil de ICP salvo.");
      if (!profile && result.data) onCreated?.(result.data.id);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    if (!profile) return;
    setActivating(true);
    setError(null);
    setMessage(null);
    try {
      const result = await activateIcpProfileAction(profile.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Perfil ativado — todos os leads foram recalculados.");
      router.refresh();
    } finally {
      setActivating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dados do perfil</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Peso total: {weightTotal}</Badge>
            <Badge variant="neutral">{configuredCount} critério(s) configurado(s)</Badge>
            {profile?.isActive && <Badge variant="brand">Perfil ativo</Badge>}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="icp-profile-name">Nome do perfil *</Label>
            <Input id="icp-profile-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="icp-profile-description">Descrição</Label>
            <Input id="icp-profile-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {ICP_CRITERIA.map((meta) => {
          const state = criteria[meta.value];
          const isOpen = expanded.has(meta.value);
          const kind = ICP_CRITERION_KIND[meta.value];
          return (
            <Card key={meta.value}>
              <button
                type="button"
                onClick={() => toggleExpanded(meta.value)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-ink-400 transition-transform", isOpen && "rotate-180")}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium text-ink-900">{meta.label}</p>
                    <p className="text-xs text-ink-500 capitalize">{kind === "boolean" ? "presença" : kind}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Label htmlFor={`weight-${meta.value}`} className="text-xs text-ink-500">
                    Peso
                  </Label>
                  <Input
                    id={`weight-${meta.value}`}
                    type="number"
                    min={0}
                    max={100}
                    className="h-8 w-20 text-sm"
                    value={state.weight}
                    onChange={(e) => updateCriterion(meta.value, { weight: Number(e.target.value) || 0 })}
                  />
                </div>
              </button>
              {isOpen && (
                <CardContent className="pt-0">
                  <CriterionRulesEditor
                    type={meta.value}
                    rules={state.rules}
                    onChange={(rules) => updateCriterion(meta.value, { rules })}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {error}
        </p>
      )}
      {message && <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-500">{message}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" aria-hidden />
          {saving ? "Salvando..." : "Salvar perfil"}
        </Button>
        {profile && !profile.isActive && (
          <Button type="button" variant="outline" onClick={handleActivate} disabled={activating}>
            <Sparkles className="h-4 w-4" aria-hidden />
            {activating ? "Ativando..." : "Ativar e recalcular leads"}
          </Button>
        )}
      </div>
    </form>
  );
}
