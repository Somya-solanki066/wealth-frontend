function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function getBackendOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  return stripTrailingSlash(raw).replace(/\/api$/i, "");
}

export function getBackendApiUrl(): string {
  return `${getBackendOrigin()}/api`;
}