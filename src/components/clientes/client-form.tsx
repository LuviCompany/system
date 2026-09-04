"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLIENT_SEGMENTS, CLIENT_STATUS_LABELS } from "@/modules/clientes/constants";
import type { ActionResult } from "@/server/clients/actions";
import type { ClientInput } from "@/server/clients/client.schema";

export interface ClientFormValues {
  name: string;
  tradeName: string;
  cnpj: string;
  website: string;
  instagram: string;
  segment: string;
  email: string;
  phone: string;
  responsavelId: string;
  status: string;
}

const EMPTY_VALUES: ClientFormValues = {
  name: "",
  tradeName: "",
  cnpj: "",
  website: "",
  instagram: "",
  segment: "",
  email: "",
  phone: "",
  responsavelId: "",
  status: "ATIVO",
};

interface ClientFormProps {
  teamMembers: { id: string; name: string }[];
  initialValues?: Partial<ClientFormValues>;
  submitLabel?: string;
  onSubmit: (input: ClientInput) => Promise<ActionResult<{ id: string }>>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ teamMembers, initialValues, submitLabel = "Salvar cliente", onSubmit, onSuccess, onCancel }: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const input: ClientInput = {
      name: values.name,
      tradeName: values.tradeName || undefined,
      cnpj: values.cnpj || undefined,
      website: values.website || undefined,
      instagram: values.instagram || undefined,
      segment: values.segment || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      responsavelId: values.responsavelId || undefined,
      status: values.status as ClientInput["status"],
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
              <Label htmlFor="client-name">Nome *</Label>
              <Input id="client-name" required value={values.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-trade-name">Nome fantasia</Label>
              <Input id="client-trade-name" value={values.tradeName} onChange={(e) => update("tradeName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-cnpj">CNPJ</Label>
              <Input id="client-cnpj" value={values.cnpj} onChange={(e) => update("cnpj", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-segment">Segmento</Label>
              <Select value={values.segment} onValueChange={(value) => update("segment", value)}>
                <SelectTrigger id="client-segment">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_SEGMENTS.map((segment) => (
                    <SelectItem key={segment} value={segment}>
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-status">Status</Label>
              <Select value={values.status} onValueChange={(value) => update("status", value)}>
                <SelectTrigger id="client-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client-website">Site</Label>
              <Input id="client-website" value={values.website} onChange={(e) => update("website", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client-instagram">Instagram</Label>
              <Input id="client-instagram" value={values.instagram} onChange={(e) => update("instagram", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Contato</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-email">E-mail</Label>
              <Input id="client-email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Telefone</Label>
              <Input id="client-phone" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client-responsavel">Responsável</Label>
              <Select value={values.responsavelId} onValueChange={(value) => update("responsavelId", value)}>
                <SelectTrigger id="client-responsavel">
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
          </div>
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
