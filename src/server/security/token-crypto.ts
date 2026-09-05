import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Camada de criptografia em repouso para tokens OAuth (etapa 5 — Google Ads).
 *
 * O schema anterior deste projeto não tinha nenhum mecanismo de criptografia
 * em repouso — os poucos segredos existentes (senha de usuário) usam apenas
 * hash (bcrypt, ver server/auth/password.ts), que é o método certo pra senha
 * mas não serve pra token OAuth, porque o token precisa ser recuperado em
 * texto puro depois (hash é uma via só). Este módulo é a camada nova,
 * genérica, para qualquer segredo que precise ser guardado e depois lido de
 * volta (access token, refresh token — e no futuro, de outras plataformas
 * como Meta Ads).
 *
 * Algoritmo: AES-256-GCM (cifra autenticada — qualquer adulteração no valor
 * guardado é detectada na descriptografia, não passa silenciosamente).
 *
 * Nunca:
 * - logar o retorno de encryptToken() nem o argumento de decryptToken();
 * - devolver o resultado de decryptToken() para o frontend;
 * - guardar TOKEN_ENCRYPTION_KEY em código ou em qualquer arquivo versionado.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // recomendado pelo NIST para GCM
const KEY_LENGTH_BYTES = 32; // AES-256

function getEncryptionKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY não está definida. Gere uma com: " +
        `node -e "console.log(require('crypto').randomBytes(${KEY_LENGTH_BYTES}).toString('base64'))"`,
    );
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY inválida: esperado ${KEY_LENGTH_BYTES} bytes em base64, recebido ${key.length}.`,
    );
  }
  return key;
}

/** Criptografa um valor sensível (ex: access/refresh token). Formato do retorno: "iv.authTag.cipherText" (cada parte em base64). */
export function encryptToken(plainText: string): string {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

/** Descriptografa um valor gerado por encryptToken(). Lança erro se o valor foi adulterado ou a chave mudou. */
export function decryptToken(cipherText: string): string {
  const parts = cipherText.split(".");
  if (parts.length !== 3) {
    throw new Error("Formato de token criptografado inválido.");
  }
  const [ivB64, authTagB64, dataB64] = parts;

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
