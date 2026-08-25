// Shared by the sign-in page and the server-side redirect helper, so one
// implementation decides what a safe return path is.
//
// Only same-origin relative paths are accepted. The candidate is resolved
// against a fixed base and its origin compared, because prefix tests miss
// "/\evil.com": the URL parser folds the backslash into a slash for special
// schemes, which makes it scheme-relative and sends the browser off-site.
const BASE = "https://app.local";

export function safeRelativeReturnPath(value: string, fallback = "/"): string {
  if (!value.startsWith("/")) return fallback;
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  if (url.pathname === "/login") return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
