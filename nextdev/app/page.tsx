// nextdev/app/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import GreetingMessage from "./GreetingMessage";
import Navbar from "./components/Navbar";
import RatingPlaque from "./components/RatingPlaque";
import { getCurrentUser } from "./lib/auth";
import { Post } from "./lib/types";

interface TopPoster {
  author_id: number;
  username: string;
  total_views: number;
}

interface TopPostItem {
  idposts: number;
  title: string;
  view_count: number;
  author_id: number;
  author_name: string;
}

export default async function Home() {
  // Server-side check with backend
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    // Not authenticated -> redirect to login page
    redirect("/login");
  }

  // Fetch all posts
  const postsRes = await fetch("http://localhost:8000/posts", {
    cache: "no-store",
  });

  let posts: Post[] = [];
  if (postsRes.ok) {
    posts = await postsRes.json();
  }

  // Fetch top posters for today and week
  let topPostersToday: TopPoster[] = [];
  let topPostersWeek: TopPoster[] = [];
  try {
    const todayRes = await fetch("http://localhost:8000/posts/stats/top-posters?period=today", { cache: "no-store" });
    if (todayRes.ok) topPostersToday = await todayRes.json();
    
    const weekRes = await fetch("http://localhost:8000/posts/stats/top-posters?period=week", { cache: "no-store" });
    if (weekRes.ok) topPostersWeek = await weekRes.json();
  } catch (err) {
    console.error("Failed to fetch top posters:", err);
  }

  // Fetch top posts for today and week
  let topPostsToday: TopPostItem[] = [];
  let topPostsWeek: TopPostItem[] = [];
  try {
    const todayRes = await fetch("http://localhost:8000/posts/stats/top-posts?period=today", { cache: "no-store" });
    if (todayRes.ok) topPostsToday = await todayRes.json();
    
    const weekRes = await fetch("http://localhost:8000/posts/stats/top-posts?period=week", { cache: "no-store" });
    if (weekRes.ok) topPostsWeek = await weekRes.json();
  } catch (err) {
    console.error("Failed to fetch top posts:", err);
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-10 px-10">
        <div className="w-full max-w-6xl grid grid-cols-3 gap-6">
          {/* Left Column - Latest Posts */}
          <div className="col-span-2">
            <GreetingMessage username={currentUser.username} />
            
            {/* Posts Section */}
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-6">Последние посты</h2>
              
              {posts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">Нет доступных постов.</p>
              ) : (
                <div>
                  {posts.map((post) => (
                    <Link key={post.idposts} href={`/posts/${post.idposts}`}>
                      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer mb-4">
                        <RatingPlaque rating={post.rating} />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 pr-16">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Автор: <span className="font-medium">{post.author_name}</span> • {new Date(post.date).toLocaleDateString('ru-RU')}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                          {post.text}
                        </p>
                        <div className="flex gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>💬 {post.comment_count || 0}</span>
                          <span>👁️ {post.view_count || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="col-span-1 space-y-6">
            {/* Top Posters Today */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👑 ТОП авторов (сегодня)</h3>
              {topPostersToday.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {topPostersToday.slice(0, 3).map((poster, idx) => (
                    <Link key={poster.author_id} href={`/profile/${poster.author_id}`}>
                      <div className="p-2 mb-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{idx + 1}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{poster.username}</span>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{poster.total_views} 👁️</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Top Posters Week */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👑 ТОП авторов (неделя)</h3>
              {topPostersWeek.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {topPostersWeek.slice(0, 3).map((poster, idx) => (
                    <Link key={poster.author_id} href={`/profile/${poster.author_id}`}>
                      <div className="p-2 mb-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{idx + 1}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{poster.username}</span>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{poster.total_views} 👁️</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Top Posts Today */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔥 ТОП посты (сегодня)</h3>
              {topPostsToday.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {topPostsToday.slice(0, 3).map((post, idx) => (
                    <Link key={post.idposts} href={`/posts/${post.idposts}`}>
                      <div className="p-2 mb-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">#{idx + 1}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{post.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{post.author_name}</p>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{post.view_count} 👁️</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Top Posts Week */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔥 ТОП посты (неделя)</h3>
              {topPostsWeek.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {topPostsWeek.slice(0, 3).map((post, idx) => (
                    <Link key={post.idposts} href={`/posts/${post.idposts}`}>
                      <div className="p-2 mb-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">#{idx + 1}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{post.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{post.author_name}</p>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{post.view_count} 👁️</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

