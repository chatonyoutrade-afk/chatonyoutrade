import { redirect } from "next/navigation";
import { readSessionUser } from "../lib/session";
import { safeRelativeReturnPath } from "./auth-return";

export type AppUser = {
  displayName: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
};

const SIGN_IN_PATH = "/login";

export async function getUser(): Promise<AppUser | null> {
  const user = await readSessionUser();
  if (!user) return null;
  return { displayName: user.displayName, email: user.email, fullName: user.displayName, emailVerified: Boolean(user.emailVerifiedAt) };
}

export async function requireUser(returnTo: string): Promise<AppUser> {
  const user = await getUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export { safeRelativeReturnPath };
