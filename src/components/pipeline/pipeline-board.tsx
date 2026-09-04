"use client";

import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";
import { KanbanColumn } from "@/components/pipeline/kanban-column";
import { PIPELINE_STAGES, type PipelineStageValue } from "@/modules/leads/constants";
import { moveLeadStageAction } from "@/server/leads/actions";
import type { LeadWithRelations } from "@/server/leads/lead.service";

interface PipelineBoardProps {
  leadsByStage: Record<string, LeadWithRelations[]>;
  availableTags: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
  currentUserId: string;
}

export function PipelineBoard({ leadsByStage, availableTags, teamMembers, currentUserId }: PipelineBoardProps) {
  const router = useRouter();
  const [board, setBoard] = useState(leadsByStage);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function moveLead(leadId: string, toStage: string) {
    setBoard((prev) => {
      const next: Record<string, LeadWithRelations[]> = {};
      let movedLead: LeadWithRelations | undefined;

      for (const stage of Object.keys(prev)) {
        next[stage] = prev[stage].filter((lead) => {
          if (lead.id === leadId) {
            movedLead = lead;
            return false;
          }
          return true;
        });
      }

      if (movedLead) {
        movedLead = { ...movedLead, stage: toStage as LeadWithRelations["stage"] };
        next[toStage] = [movedLead, ...(next[toStage] ?? [])];
      }

      return next;
    });

    void moveLeadStageAction(leadId, toStage as PipelineStageValue).then(() => router.refresh());
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const fromStage = active.data.current?.stage as string | undefined;
    const toStage = String(over.id);
    if (!fromStage || fromStage === toStage) return;
    moveLead(String(active.id), toStage);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <KanbanColumn
              key={stage.value}
              stage={stage.value}
              label={stage.label}
              leads={board[stage.value] ?? []}
              onMoveStage={moveLead}
              onOpen={setSelectedLeadId}
            />
          ))}
        </div>
      </DndContext>

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
    </>
  );
}
