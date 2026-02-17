const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function resolveAssetUrl(url?: string | null, baseUrl?: string): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const resolvedBase = (baseUrl ?? DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${resolvedBase}${normalizedPath}`;
}
