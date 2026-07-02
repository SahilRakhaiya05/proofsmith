import { z } from "zod";

export const GitHubUserSchema = z.object({
  id: z.number(), login: z.string(), avatar_url: z.string().url(), html_url: z.string().url(), name: z.string().nullable(),
});

const SessionSchema = z.object({
  user: GitHubUserSchema,
  accessToken: z.string().min(20),
  expiresAt: z.number(),
});
export type GitHubSession = z.infer<typeof SessionSchema>;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function keyFromSecret(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function sealSession(session: GitHubSession, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFromSecret(secret), new TextEncoder().encode(JSON.stringify(SessionSchema.parse(session))));
  return `${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(encrypted))}`;
}

export async function openSession(value: string, secret: string) {
  try {
    const [iv, payload] = value.split(".");
    if (!iv || !payload) return null;
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64UrlToBytes(iv) }, await keyFromSecret(secret), base64UrlToBytes(payload));
    const session = SessionSchema.parse(JSON.parse(new TextDecoder().decode(decrypted)));
    return session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

export function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
}

export function cookie(name: string, value: string, options: { maxAge: number; secure: boolean }) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${options.maxAge}${options.secure ? "; Secure" : ""}`;
}
