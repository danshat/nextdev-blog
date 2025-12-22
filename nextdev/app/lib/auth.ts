import { cookies } from "next/headers";
import { User } from "@/app/lib/types";

export async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return Array.from(cookieStore)
    .map(([name, cookie]) => `${name}=${cookie.value}`)
    .join("; ");
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieHeader = await getCookieHeader();
  
  try {
    const res = await fetch("http://localhost:8000/auth/me", {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as User;
  } catch {
    return null;
  }
}
