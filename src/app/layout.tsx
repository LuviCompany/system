import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { getServerTheme } from "@/server/theme/theme.service";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LUVI SYSTEM",
    template: "%s · LUVI SYSTEM",
  },
  description: "Transforme prospecção em resultado.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getServerTheme();

  return (
    <html lang="pt-BR" data-theme={theme} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
