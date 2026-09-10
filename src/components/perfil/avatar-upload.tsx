"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/modules/team/roles";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Seleção de foto de perfil — 100% local (FileReader → data URL em memória),
 * sem nenhuma chamada ao servidor. O projeto ainda não tem uma solução de
 * armazenamento persistente configurada (sem S3/Vercel Blob/Cloudinary) e
 * `User` não tem coluna de avatar — ver ARCHITECTURE.md / relatório da
 * etapa. Quando o armazenamento real existir, a lógica de upload entra
 * aqui e o preview passa a persistir de verdade.
 */
export function AvatarUpload({ name }: { name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Envie uma imagem JPG, JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("A imagem deve ter até 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {preview && <AvatarImage src={preview} alt="" />}
        <AvatarFallback className="text-base">{initials(name)}</AvatarFallback>
      </Avatar>

      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Camera className="h-3.5 w-3.5" aria-hidden />
            Alterar foto
          </Button>
          {preview && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(null)}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Remover foto
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Selecionar foto de perfil"
        />
        {error && (
          <p role="alert" className="text-xs text-danger-600">
            {error}
          </p>
        )}
        <p className="text-xs text-ink-400">
          Pré-visualização local nesta sessão do navegador — o armazenamento permanente da foto será conectado numa próxima etapa.
        </p>
      </div>
    </div>
  );
}
