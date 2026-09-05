import type { NormalizedEngagement } from "@/server/integrations/social-media-provider";

/**
 * Dados individualizados de engajamento (quem comentou/curtiu) — a
 * Instagram Graph API só expõe isso de forma limitada (ex: lista de
 * comentários via `/{media-id}/comments`, sem curtidas individuais) e exige
 * permissões extras sujeitas a revisão do Meta. Por isso este módulo nunca
 * inventa usuários (item 12): sem uma integração real conectada, sempre
 * devolve lista vazia — o dashboard já sabe mostrar só as métricas
 * agregadas nesse caso (ver TopEngagement em components/clientes).
 */
export async function fetchTopEngagedUsers(): Promise<NormalizedEngagement[]> {
  return [];
}
