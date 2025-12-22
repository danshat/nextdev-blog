import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Profile() {
  const cookieStore = await cookies();

  const cookieHeader = Array.from(cookieStore)
    .map(([name, cookie]) => `${name}=${cookie.value}`)
    .join("; ");

  // Server-side check with backend
  const res = await fetch("http://localhost:8000/auth/me", {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) {
    // Not authenticated -> redirect to login page
    redirect("/login");
  }

  const user = await res.json();

  // Redirect to the user's own profile
  redirect(`/profile/${user.id}`);
}

