"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { User } from "@/app/lib/types";

interface UserSearchResult extends User {
  registration_date?: string;
}

interface UsersSearchClientProps {
  currentUser: User;
}

export default function UsersSearchClient({ currentUser }: UsersSearchClientProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all users on mount
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/users", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setSearched(true);
      }
    } catch (error) {
      console.error("Load users error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (query.trim().length === 0) {
      // Empty query - show all users
      await loadAllUsers();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/users/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-semibold">
          Администратор
        </span>
      );
    } else if (role === "moderator") {
      return (
        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
          Модератор
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar currentUser={currentUser} />

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-10 px-10">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-white">Поиск пользователей</h1>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Введите имя пользователя..."
                maxLength={100}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Поиск..." : "Поиск"}
              </button>
            </div>
          </form>

          {/* Results */}
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
            </div>
          ) : results.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-10">
              {query.trim().length > 0 ? "Пользователи не найдены." : "Нет пользователей."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-semibold text-gray-900 dark:text-white truncate flex-1">{user.username}</h2>
                    {user.role !== "user" && getRoleBadge(user.role)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Зарегистрирован: {user.registration_date ? new Date(user.registration_date).toLocaleDateString("ru-RU") : "N/A"}
                  </p>
                  {user.is_banned && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-2">🚫 Заблокирован</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
