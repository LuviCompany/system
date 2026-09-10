import {
  BarChart3,
  Building2,
  ClipboardList,
  Compass,
  FileBarChart,
  FileText,
  Image as ImageIcon,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  Upload,
  UserRound,
  UserSearch,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const siteConfig = {
  name: "LUVI",
  product: "LUVI SYSTEM",
  tagline: "Transforme prospecção em resultado.",
};

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
  /** Desenha uma linha divisória acima da seção — usado para separar
   * visualmente o CRM de prospecção do módulo LUVI CLIENTES. */
  separatorBefore?: boolean;
}

export const navSections: NavSection[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Prospecção",
    items: [
      { label: "Leads", href: "/leads", icon: Users },
      { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
      { label: "Atividades", href: "/atividades", icon: ClipboardList },
      { label: "Follow-ups", href: "/follow-ups", icon: Target },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { label: "ICP", href: "/icp", icon: Compass },
      { label: "Qualificação", href: "/qualificacao", icon: Sparkles },
      { label: "Relatórios", href: "/relatorios", icon: FileText },
    ],
  },
  {
    label: "Aquisição",
    items: [
      { label: "Importar Leads", href: "/importar-leads", icon: Upload },
      { label: "Encontrar Leads", href: "/encontrar-leads", icon: UserSearch },
    ],
  },
  {
    label: "Clientes",
    separatorBefore: true,
    items: [
      { label: "Overview", href: "/clientes", icon: BarChart3 },
      { label: "Clientes", href: "/clientes/lista", icon: Building2 },
      { label: "Relatórios", href: "/clientes/relatorios", icon: FileBarChart },
      { label: "Social Media", href: "/social-media", icon: ImageIcon },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Equipe", href: "/equipe", icon: UserRound },
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];
