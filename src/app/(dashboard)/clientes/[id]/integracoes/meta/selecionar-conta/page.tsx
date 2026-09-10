import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SelectMetaAdAccountForm } from "@/components/clientes/select-meta-ad-account-form";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";
import { listAccessibleAccountsForClient } from "@/server/integrations/meta/connection.service";
import { toMetaError } from "@/server/integrations/meta/errors";

export const metadata: Metadata = { title: "Selecionar conta do Meta Ads" };

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Etapa 7 — depois do OAuth, o usuário escolhe qual conta de anúncios da Meta usar (mesmo padrão do Google Ads). */
export default async function SelecionarContaMetaAdsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();

  const client = await getClientById(session.organizationId, id);
  if (!client) notFound();

  let accounts: Awaited<ReturnType<typeof listAccessibleAccountsForClient>> = [];
  let error: string | null = null;

  try {
    accounts = await listAccessibleAccountsForClient(session.organizationId, id, "META_ADS");
  } catch (err) {
    error = toMetaError(err).friendlyMessage;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Selecione a conta de anúncios da Meta</h1>
        <p className="text-sm text-ink-500">
          Autorização concluída para {client.tradeName ?? client.name}. Escolha qual conta de anúncios será usada nesta conexão.
        </p>
      </div>

      {error && <div className="rounded-md border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">{error}</div>}

      {!error && accounts.length === 0 && (
        <p className="text-sm text-ink-500">
          Nenhuma conta de anúncios da Meta foi encontrada para o usuário que autorizou. Verifique se ele tem acesso a alguma conta de
          anúncios no Gerenciador de Negócios.
        </p>
      )}

      {accounts.length > 0 && <SelectMetaAdAccountForm clientId={id} accounts={accounts} />}
    </div>
  );
}
