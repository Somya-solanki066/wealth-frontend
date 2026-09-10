function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/** Split comma/semicolon-separated env URL lists. First entry is primary. */
function parseEnvUrls(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function pickPrimaryBackendUrl(): string {
  const fromBackend = parseEnvUrls(process.env.NEXT_PUBLIC_BACKEND_URL);
  const fromApi = parseEnvUrls(process.env.NEXT_PUBLIC_API_URL);
  return fromBackend[0] || fromApi[0] || "http://localhost:5000";
}

/** All configured backend base URLs (comma-separated in env). */
export function getBackendUrls(): string[] {
  const urls = [
    ...parseEnvUrls(process.env.NEXT_PUBLIC_BACKEND_URL),
    ...parseEnvUrls(process.env.NEXT_PUBLIC_API_URL),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const origin = stripTrailingSlash(raw).replace(/\/api$/i, "");
    if (seen.has(origin)) continue;
    seen.add(origin);
    out.push(origin);
  }
  return out.length > 0 ? out : ["http://localhost:5000"];
}

export function getBackendOrigin(): string {
  return stripTrailingSlash(pickPrimaryBackendUrl()).replace(/\/api$/i, "");
}

export function getBackendApiUrl(): string {
  return `${getBackendOrigin()}/api`;
}
