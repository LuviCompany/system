"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ICP_CRITERION_KIND, type IcpCriterionTypeValue } from "@/modules/icp/constants";

export interface RuleState {
  key: string;
  label: string;
  min: string;
  max: string;
  matchValues: string;
  score: string;
}

interface CriterionRulesEditorProps {
  type: IcpCriterionTypeValue;
  rules: RuleState[];
  onChange: (rules: RuleState[]) => void;
}

export function CriterionRulesEditor({ type, rules, onChange }: CriterionRulesEditorProps) {
  const kind = ICP_CRITERION_KIND[type];

  if (kind === "boolean") {
    return (
      <p className="text-xs text-ink-500">
        Pontuação total do peso é aplicada quando o lead tem este dado preenchido; zero quando não tem.
        Não usa faixas.
      </p>
    );
  }

  function updateRule(key: string, patch: Partial<RuleState>) {
    onChange(rules.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)));
  }

  function addRule() {
    onChange([
      ...rules,
      { key: crypto.randomUUID(), label: "", min: "", max: "", matchValues: "", score: "50" },
    ]);
  }

  function removeRule(key: string) {
    onChange(rules.filter((rule) => rule.key !== key));
  }

  return (
    <div className="space-y-2">
      {rules.length === 0 && <p className="text-xs text-ink-500">Nenhuma faixa configurada — o critério sempre pontua 0.</p>}
      {rules.map((rule) => (
        <div key={rule.key} className="grid grid-cols-12 items-center gap-2 rounded-md border border-border bg-well p-2">
          <Input
            className="col-span-3"
            placeholder="Rótulo"
            value={rule.label}
            onChange={(e) => updateRule(rule.key, { label: e.target.value })}
          />
          {kind === "numeric" ? (
            <>
              <Input
                className="col-span-2"
                type="number"
                placeholder="Mín."
                value={rule.min}
                onChange={(e) => updateRule(rule.key, { min: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                placeholder="Máx. (vazio = sem limite)"
                value={rule.max}
                onChange={(e) => updateRule(rule.key, { max: e.target.value })}
              />
            </>
          ) : (
            <Input
              className="col-span-4"
              placeholder="Valores (separados por vírgula)"
              value={rule.matchValues}
              onChange={(e) => updateRule(rule.key, { matchValues: e.target.value })}
            />
          )}
          <Input
            className="col-span-2"
            type="number"
            min={0}
            max={100}
            placeholder="Pontos"
            value={rule.score}
            onChange={(e) => updateRule(rule.key, { score: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="col-span-1"
            aria-label="Remover faixa"
            onClick={() => removeRule(rule.key)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRule}>
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Adicionar faixa
      </Button>
    </div>
  );
}
