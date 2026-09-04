"use client";

import { useState } from "react";

import { ScoreBadge } from "@/components/leads/score-badge";
import { ScoreExplanation, type ExplainableScoreFactor } from "@/components/leads/score-explanation";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";

interface ScoreExplanationTriggerProps {
  score: number;
  factors: ExplainableScoreFactor[];
  companyName: string;
  showLabel?: boolean;
}

/** ICP Score clicável — abre a explicação "por que este lead recebeu X pontos?" (item 7 da Etapa 3). */
export function ScoreExplanationTrigger({ score, factors, companyName, showLabel = true }: ScoreExplanationTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <ScoreBadge score={score} showLabel={showLabel} />
      </button>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{companyName}</ModalTitle>
        </ModalHeader>
        <ScoreExplanation score={score} factors={factors} />
      </ModalContent>
    </Modal>
  );
}
