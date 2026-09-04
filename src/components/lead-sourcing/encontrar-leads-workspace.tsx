"use client";

import { Info, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { SearchResultsTable } from "@/components/lead-sourcing/search-results-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAZIL_STATES } from "@/modules/leads/constants";
import { SEARCH_QUANTITY_OPTIONS } from "@/server/lead-sourcing/schema";
import { searchLeadSourceAction } from "@/server/lead-sourcing/actions";
import type { LeadSearchRunResult } from "@/server/lead-sourcing/search.service";
import type { IcpProfileForClient } from "@/server/icp/icp.service";

const NO_PROFILE = "NONE";
const ALL_STATES = "ALL_STATES";

interface EncontrarLeadsWorkspaceProps {
  icpProfiles: IcpProfileForClient[];
  googleConfigured: boolean;
}

export function EncontrarLeadsWorkspace({ icpProfiles, googleConfigured }: EncontrarLeadsWorkspaceProps) {
  const activeProfile = icpProfiles.find((p) => p.isActive) ?? null;

  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<string>("");
  const [quantity, setQuantity] = useState("20");
  const [icpProfileId, setIcpProfileId] = useState<string>(activeProfile?.id ?? NO_PROFILE);
  const [keyword, setKeyword] = useState("");

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<LeadSearchRunResult | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSearching(true);
    setError(null);
    try {
      const result = await searchLeadSourceAction({
        segment,
        city,
        state,
        keyword,
        quantity: Number(quantity) || 20,
        icpProfileId: icpProfileId === NO_PROFILE ? undefined : icpProfileId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSearchResult(result.data);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      {!googleConfigured && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm text-ink-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          <span>
            <strong className="font-medium text-ink-800">Modo demonstração</strong> — Google Places não configurado, os
            resultados abaixo são fictícios (provider mock). Configure em{" "}
            <Link href="/configuracoes/integracoes" className="font-medium text-brand-500 hover:underline">
              Configurações → Integrações
            </Link>{" "}
            para buscar empresas reais.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="find-segment">Segmento</Label>
            <Input
              id="find-segment"
              placeholder="Ex: E-commerce de moda"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="find-city">Cidade</Label>
            <Input id="find-city" placeholder="Ex: São Paulo" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="find-state">Estado</Label>
            <Select value={state || ALL_STATES} onValueChange={(value) => setState(value === ALL_STATES ? "" : value)}>
              <SelectTrigger id="find-state">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATES}>Qualquer estado</SelectItem>
                {BRAZIL_STATES.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="find-keyword">Palavra-chave</Label>
            <Input
              id="find-keyword"
              placeholder="Ex: moda, saúde, tecnologia"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="find-quantity">Quantidade desejada</Label>
            <Select value={quantity} onValueChange={setQuantity}>
              <SelectTrigger id="find-quantity">
                <SelectValue placeholder="Quantidade" />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_QUANTITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="find-icp">ICP aplicado</Label>
            <Select value={icpProfileId} onValueChange={setIcpProfileId}>
              <SelectTrigger id="find-icp">
                <SelectValue placeholder="Selecione um perfil de ICP" />
              </SelectTrigger>
              <SelectContent>
                {icpProfiles.length === 0 && <SelectItem value={NO_PROFILE}>Nenhum perfil configurado</SelectItem>}
                {icpProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                    {profile.isActive ? " (ativo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={searching} className="w-full sm:w-auto">
          <Search className="h-4 w-4" aria-hidden />
          {searching ? "Buscando..." : "Buscar empresas"}
        </Button>

        {error && (
          <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-500">
            {error}
          </p>
        )}

        {icpProfiles.length === 0 && (
          <p className="rounded-md bg-surface-subtle px-3 py-2 text-sm text-ink-500">
            Nenhum perfil de ICP configurado ainda — os resultados virão sem pontuação. Configure um em{" "}
            <span className="font-medium text-ink-700">ICP</span> para priorizar automaticamente.
          </p>
        )}
      </form>

      {searchResult && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Resultados</h2>
          <SearchResultsTable
            queryId={searchResult.queryId}
            results={searchResult.results}
            providerId={searchResult.provider.id}
            providerLabel={searchResult.provider.label}
            onResultsUpdated={(updated) =>
              setSearchResult((prev) => {
                if (!prev) return prev;
                const byId = new Map(updated.map((r) => [r.id, r]));
                return { ...prev, results: prev.results.map((r) => byId.get(r.id) ?? r) };
              })
            }
          />
        </div>
      )}
    </div>
  );
}
