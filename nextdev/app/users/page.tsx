import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth";
import UsersSearchClient from "./UsersSearchClient";

export default async function UsersPage() {
  // Server-side check with backend
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    // Not authenticated -> redirect to login page
    redirect("/login");
  }

  // Return the client component
  return <UsersSearchClient currentUser={currentUser} />;
}
