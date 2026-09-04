import type { UserRole } from "@/server/auth/session";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  VENDEDOR: "Vendedor",
};

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
  { value: "GESTOR", label: ROLE_LABELS.GESTOR },
  { value: "VENDEDOR", label: ROLE_LABELS.VENDEDOR },
];

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
