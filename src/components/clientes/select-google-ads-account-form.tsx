"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AccessibleAccount } from "@/server/integrations/ads-provider";
import { selectGoogleAdsAccountAction } from "@/server/integrations/google-ads/actions";

interface SelectGoogleAdsAccountFormProps {
  clientId: string;
  accounts: AccessibleAccount[];
}

export function SelectGoogleAdsAccountForm({ clientId, accounts }: SelectGoogleAdsAccountFormProps) {
  const [selected, setSelected] = useState<string>(accounts[0]?.externalAccountId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    const account = accounts.find((a) => a.externalAccountId === selected);
    if (!account) return;

    setSubmitting(true);
    setError(null);
    const result = await selectGoogleAdsAccountAction(clientId, account);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/clientes/${clientId}/google-ads`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {accounts.map((account) => (
          <label
            key={account.externalAccountId}
            className="flex cursor-pointer items-center justify-between rounded-md border border-border-strong bg-surface px-4 py-3 has-[:checked]:border-brand-500"
          >
            <span>
              <span className="block font-medium text-ink-900">{account.name ?? "Sem nome"}</span>
              <span className="block text-xs text-ink-500">
                ID: {account.externalAccountId}
                {account.currencyCode ? ` · ${account.currencyCode}` : ""}
              </span>
            </span>
            <input
              type="radio"
              name="google-ads-account"
              value={account.externalAccountId}
              checked={selected === account.externalAccountId}
              onChange={(e) => setSelected(e.target.value)}
              className="h-4 w-4 accent-brand-500"
            />
          </label>
        ))}
      </div>

      {error && (
        <Card>
          <CardContent className="p-3 text-sm text-danger-600">{error}</CardContent>
        </Card>
      )}

      <Button disabled={!selected || submitting} onClick={handleConfirm}>
        {submitting ? "Confirmando..." : "Usar esta conta"}
      </Button>
    </div>
  );
}
