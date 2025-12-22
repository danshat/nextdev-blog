import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import RatingPlaque from "@/app/components/RatingPlaque";
import { getCurrentUser } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { Post } from "@/app/lib/types";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TagPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Server-side check with backend
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    // Not authenticated -> redirect to login page
    redirect("/login");
  }

  // Fetch posts for this tag
  const postsRes = await fetch(`http://localhost:8000/tags/${resolvedParams.id}/posts`, {
    cache: "no-store",
  });

  let posts: Post[] = [];
  if (postsRes.ok) {
    posts = await postsRes.json();
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-10 px-10">
        <div className="w-full max-w-3xl">
          {/* Back button */}
          <Link href="/tags" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm mb-6 inline-block">
            ← Вернуться к тегам
          </Link>

          {/* Posts list */}
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">По этому тегу нет постов.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.idposts}
                  href={`/posts/${post.idposts}`}
                  className="relative block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
                >
                  <RatingPlaque rating={post.rating} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 pr-12">{post.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">{post.text}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Автор: <span className="font-medium text-gray-700 dark:text-gray-300">{post.author_name}</span>
                    </span>
                    <span>{new Date(post.date).toLocaleDateString("ru-RU")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
