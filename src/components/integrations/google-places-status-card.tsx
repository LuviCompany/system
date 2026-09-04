"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { testGooglePlacesConnectionAction } from "@/server/integrations/actions";

interface GooglePlacesStatusCardProps {
  configured: boolean;
}

export function GooglePlacesStatusCard({ configured }: GooglePlacesStatusCardProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testGooglePlacesConnectionAction();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Google Places</CardTitle>
          <CardDescription>Fonte real de busca de empresas em /encontrar-leads.</CardDescription>
        </div>
        <Badge variant={configured ? "success" : "neutral"}>{configured ? "Configurado" : "Não configurado"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm text-ink-600">
        <p>
          {configured
            ? "Chave configurada. As buscas em Encontrar Leads usam a Places API (New) do Google."
            : "Chave não configurada. Encontrar Leads continua funcionando em modo demonstração (dados fictícios) até a variável GOOGLE_MAPS_API_KEY ser definida no ambiente."}
        </p>
        {testResult && (
          <p role="status" className={`rounded-md px-3 py-2 text-sm ${testResult.ok ? "bg-success-50 text-success-500" : "bg-danger-50 text-danger-500"}`}>
            {testResult.ok ? "Conexão com o Google Places funcionando." : testResult.error}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? "Testando..." : "Testar conexão"}
        </Button>
      </CardFooter>
    </Card>
  );
}
