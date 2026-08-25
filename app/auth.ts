import { redirect } from "next/navigation";
import { readSessionUser } from "../lib/session";

export type AppUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

const SIGN_IN_PATH = "/login";

export async function getUser(): Promise<AppUser | null> {
  const user = await readSessionUser();
  if (!user) return null;
  return { displayName: user.displayName, email: user.email, fullName: user.displayName };
}

export async function requireUser(returnTo: string): Promise<AppUser> {
  const user = await getUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

// Only same-origin relative paths are accepted, so a crafted return_to cannot
// bounce a signed-in user to another site.
export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (url.pathname === SIGN_IN_PATH) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
