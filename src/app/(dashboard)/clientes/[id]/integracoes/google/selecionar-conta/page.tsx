import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SelectGoogleAdsAccountForm } from "@/components/clientes/select-google-ads-account-form";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";
import { listAccessibleAccountsForClient } from "@/server/integrations/google-ads/connection.service";
import { toGoogleAdsError } from "@/server/integrations/google-ads/errors";

export const metadata: Metadata = { title: "Selecionar conta do Google Ads" };

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Etapa 7 — depois do OAuth, o usuário escolhe qual conta (customer) do Google Ads usar. */
export default async function SelecionarContaGoogleAdsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();

  const client = await getClientById(session.organizationId, id);
  if (!client) notFound();

  let accounts: Awaited<ReturnType<typeof listAccessibleAccountsForClient>> = [];
  let error: string | null = null;

  try {
    accounts = await listAccessibleAccountsForClient(session.organizationId, id);
  } catch (err) {
    error = toGoogleAdsError(err).friendlyMessage;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Selecione a conta do Google Ads</h1>
        <p className="text-sm text-ink-500">
          Autorização concluída para {client.tradeName ?? client.name}. Escolha qual conta será usada nesta conexão.
        </p>
      </div>

      {error && <div className="rounded-md border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">{error}</div>}

      {!error && accounts.length === 0 && (
        <p className="text-sm text-ink-500">
          Nenhuma conta Google Ads acessível foi encontrada para o usuário que autorizou. Verifique se ele tem acesso a alguma conta
          no Google Ads.
        </p>
      )}

      {accounts.length > 0 && <SelectGoogleAdsAccountForm clientId={id} accounts={accounts} />}
    </div>
  );
}
