import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { getCurrentUser } from "@/app/lib/auth";
import { redirect } from "next/navigation";

interface Tag {
  idtag: number;
  name: string;
  description?: string;
  post_count?: number;
}

export default async function TagsPage() {
  // Server-side check with backend
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    // Not authenticated -> redirect to login page
    redirect("/login");
  }

  // Fetch all tags
  const tagsRes = await fetch("http://localhost:8000/tags", {
    cache: "no-store",
  });

  let tags: Tag[] = [];
  if (tagsRes.ok) {
    tags = await tagsRes.json();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="w-full max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">Теги</h1>
          
          {tags.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Нет доступных тегов.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <Link
                  key={tag.idtag}
                  href={`/tags/${tag.idtag}`}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
                >
                  <h2 className="font-semibold text-gray-900 dark:text-white">{tag.name}</h2>
                  {tag.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{tag.description}</p>
                  )}
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {tag.post_count || 0} {tag.post_count === 1 ? "пост" : "постов"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
