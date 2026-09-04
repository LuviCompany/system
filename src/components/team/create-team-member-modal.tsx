"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_OPTIONS } from "@/modules/team/roles";
import { createTeamMemberAction } from "@/server/team/actions";

export function CreateTeamMemberModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VENDEDOR");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await createTeamMemberAction({ name, email, password, role });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("VENDEDOR");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" aria-hidden />
          Novo usuário
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Novo usuário</ModalTitle>
          <ModalDescription>
            Crie um acesso de desenvolvimento para um membro da equipe. Convite por e-mail real não está disponível
            nesta etapa — compartilhe a senha diretamente com a pessoa.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Nome</Label>
            <Input id="member-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email">E-mail</Label>
            <Input id="member-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-password">Senha temporária</Label>
            <Input
              id="member-password"
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-role">Perfil</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="member-role">
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
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
              {error}
            </p>
          )}

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Criando..." : "Criar usuário"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
