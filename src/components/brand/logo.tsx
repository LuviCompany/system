import { cn } from "@/lib/utils";

/**
 * Logo oficial da LUVI Company.
 *
 * Fonte: arquivo fornecido pelo usuário ("LOGO Luvi Company png...", salvo na
 * raiz do projeto), com o fundo branco removido programaticamente (chroma key
 * por proximidade de branco) para gerar versões com fundo transparente,
 * usáveis sobre a interface dark. O logo em si não foi redesenhado nem
 * alterado — apenas recortado e com o fundo removido.
 *
 * Usamos <img> simples (não next/image) propositalmente: são arquivos locais
 * pequenos e o otimizador de imagem do Next apresentou instabilidade com o
 * PNG de fundo transparente neste projeto.
 *
 * Arquivos em `public/brand/`:
 *  - icon-mark.png    símbolo (círculos concêntricos), usado sozinho
 *  - logo-full.png    símbolo + "LUVi COMPANY." (lockup completo)
 *  - icon-*.png       favicon/app icon (ver src/app/icon.png e apple-icon.png)
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/icon-mark.png"
      alt=""
      width={32}
      height={32}
      className={cn("h-7 w-7 object-contain", className)}
    />
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-chrome-fg">LUVI</span>
        <span className="block text-[11px] tracking-wide text-chrome-fg-muted">SYSTEM</span>
      </span>
    </span>
  );
}

/** Lockup completo (símbolo + "LUVi COMPANY."), para momentos de marca — ex: tela de login. */
export function LogoFull({ className }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/logo-full.png"
      alt="Luvi Company"
      width={296}
      height={80}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
