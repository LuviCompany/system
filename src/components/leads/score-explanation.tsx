import { ScoreBadge } from "@/components/leads/score-badge";

/** Formato mínimo para exibir um fator — satisfeito tanto por `LeadScoreFactor`
 * (leads já no CRM) quanto por `ScoreFactorResult` (resultados de busca ainda
 * não importados, ver server/lead-sourcing). */
export interface ExplainableScoreFactor {
  id?: string;
  label: string;
  weight: number;
  contribution: number;
}

export function ScoreExplanation({ score, factors }: { score: number; factors: ExplainableScoreFactor[] }) {
  if (factors.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        Nenhum perfil de ICP ativo foi usado para pontuar este lead ainda. Configure e ative um perfil em{" "}
        <span className="font-medium text-ink-700">ICP</span> para calcular o score automaticamente.
      </p>
    );
  }

  const sorted = [...factors].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-ink-600">Por que este lead recebeu</p>
        <ScoreBadge score={score} showLabel />
        <p className="text-sm text-ink-600">pontos?</p>
      </div>
      <div className="space-y-1.5">
        {sorted.map((factor) => (
          <div key={factor.id ?? factor.label} className="flex items-center justify-between rounded-md border border-border bg-well px-3 py-2 text-sm">
            <span className="text-ink-700">
              {factor.label} <span className="text-ink-400">(peso {factor.weight})</span>
            </span>
            <span className={factor.contribution >= 0 ? "font-mono font-semibold text-success-500" : "font-mono font-semibold text-danger-500"}>
              {factor.contribution >= 0 ? "+" : ""}
              {factor.contribution}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border px-3 pt-2 text-sm font-semibold text-ink-900">
          <span>Total</span>
          <span className="font-mono">{score}</span>
        </div>
      </div>
    </div>
  );
}
