"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import RatingPlaque from "@/app/components/RatingPlaque";
import { getCurrentUser } from "@/app/lib/auth";
import { User, Post } from "@/app/lib/types";
import { redirect } from "next/navigation";
import { useEffect } from "react";

interface SearchPageProps {
  currentUser: User;
}

export default function SearchPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:8000/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Failed to fetch current user");
      }
    };
    fetchUser();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSearched(true);

    if (searchQuery.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (searchQuery.length > 150) {
      setError("Поисковая фраза не может быть длиннее 150 символов");
      setLoading(false);
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const res = await fetch(`http://localhost:8000/posts/search?q=${encodedQuery}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setError("Ошибка при поиске");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-10 px-10">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Поиск постов</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.slice(0, 150))}
                placeholder="Введите текст для поиска (макс. 150 символов)"
                maxLength={150}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition"
              >
                {loading ? "Поиск..." : "Поиск"}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {searchQuery.length} / 150 символов
            </p>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {searched && (
            <div>
              {loading ? (
                <p className="text-gray-600 dark:text-gray-400">Поиск...</p>
              ) : results.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "Постов не найдено" : "Введите текст для поиска"}
                </p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Найдено постов: {results.length}
                  </p>
                  <div>
                    {results.map((post) => (
                      <Link key={post.idposts} href={`/posts/${post.idposts}`}>
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition cursor-pointer mb-4">
                          <RatingPlaque rating={post.rating} />
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 pr-12">
                            {post.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {post.author_name} • {new Date(post.date).toLocaleDateString("ru-RU")}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {post.text}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>💬 {post.comment_count || 0}</span>
                            <span>👁️ {post.view_count || 0}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
