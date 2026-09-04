"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { initials, ROLE_LABELS, ROLE_OPTIONS } from "@/modules/team/roles";
import { updateTeamMemberAction } from "@/server/team/actions";
import type { UserRole } from "@/server/auth/session";

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date | string;
}

export function TeamTable({ members, canManage }: { members: TeamMemberRow[]; canManage: boolean }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleRoleChange(member: TeamMemberRow, role: string) {
    setUpdatingId(member.id);
    try {
      await updateTeamMemberAction(member.id, { name: member.name, role, active: member.active });
      router.refresh();
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleActive(member: TeamMemberRow) {
    setUpdatingId(member.id);
    try {
      await updateTeamMemberAction(member.id, { name: member.name, role: member.role, active: !member.active });
      router.refresh();
    } finally {
      setUpdatingId(null);
    }
  }

  const columns: DataTableColumn<TeamMemberRow>[] = [
    {
      key: "name",
      header: "Nome",
      render: (member) => (
        <div className="flex items-center gap-2.5">
          <Avatar>
            <AvatarFallback>{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-ink-900">{member.name}</p>
            <p className="text-xs text-ink-500">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Perfil",
      render: (member) =>
        canManage ? (
          <Select
            value={member.role}
            onValueChange={(value) => handleRoleChange(member, value)}
            disabled={updatingId === member.id}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          ROLE_LABELS[member.role]
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (member) =>
        canManage ? (
          <button
            type="button"
            onClick={() => handleToggleActive(member)}
            disabled={updatingId === member.id}
            className="cursor-pointer"
          >
            <Badge variant={member.active ? "success" : "neutral"}>{member.active ? "Ativo" : "Inativo"}</Badge>
          </button>
        ) : (
          <Badge variant={member.active ? "success" : "neutral"}>{member.active ? "Ativo" : "Inativo"}</Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Desde",
      render: (member) => formatDate(new Date(member.createdAt)),
    },
  ];

  return <DataTable columns={columns} data={members} getRowId={(member) => member.id} />;
}
