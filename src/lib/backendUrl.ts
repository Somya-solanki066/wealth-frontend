function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/** Backend origin without `/api`, e.g. https://wealth-backend-seven.vercel.app */
export function getBackendOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";
  return stripTrailingSlash(raw).replace(/\/api$/i, "");
}

/** API base including `/api`, e.g. https://wealth-backend-seven.vercel.app/api */
export function getBackendApiUrl(): string {
  return `${getBackendOrigin()}/api`;
}
