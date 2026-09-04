/**
 * Normalização de dados vindos de fontes externas de leads. Só padroniza
 * formato (espaços, maiúsculas/minúsculas, prefixos) — nunca inventa ou
 * corrige o conteúdo em si.
 */

export function normalizeCompanyName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function normalizeWebsite(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return withoutProtocol.replace(/\/+$/, "");
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeCity(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeState(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeCnpj(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export interface NormalizedBusinessFields {
  company: string;
  segment: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  email: string | null;
  cnpj: string | null;
}

export function normalizeBusinessFields(input: {
  company: string;
  segment: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  email: string | null;
  cnpj: string | null;
}): NormalizedBusinessFields {
  return {
    company: normalizeCompanyName(input.company),
    segment: input.segment?.trim() || null,
    city: normalizeCity(input.city),
    state: normalizeState(input.state),
    phone: normalizePhone(input.phone),
    website: normalizeWebsite(input.website),
    instagram: input.instagram?.trim() || null,
    linkedin: input.linkedin?.trim() || null,
    email: normalizeEmail(input.email),
    cnpj: normalizeCnpj(input.cnpj),
  };
}
