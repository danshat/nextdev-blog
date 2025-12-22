"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoutButton from "../LogoutButton";

interface Tag {
  idtag: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  username: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagLoading, setTagLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication
        const authRes = await fetch("http://localhost:8000/auth/me", {
          credentials: "include",
        });

        if (!authRes.ok) {
          router.push("/login");
          return;
        }

        const userData = await authRes.json();
        setUser(userData);

        // Fetch tags
        const tagsRes = await fetch("http://localhost:8000/tags");
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        router.push("/login");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Frontend validation
    if (title.length >= 500) {
      setError("Заголовок должен быть короче 500 символов");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setError("Заголовок не может быть пустым");
      setLoading(false);
      return;
    }

    if (!text.trim()) {
      setError("Текст поста не может быть пустым");
      setLoading(false);
      return;
    }

    try {
      const body = new URLSearchParams();
      body.append("title", title);
      body.append("text", text);
      if (selectedTags.length > 0) {
        body.append("tags", selectedTags.join(","));
      }

      const res = await fetch("http://localhost:8000/posts", {
        method: "POST",
        body,
        credentials: "include",
      });

      if (res.ok) {
        // Redirect to home page after successful post creation
        router.push("/");
        return;
      }

      if (res.status === 401) {
        setError("Вы не авторизованы");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || `Ошибка: ${res.status}`);
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    setTagError(null);
    setTagLoading(true);

    // Frontend validation
    if (newTagName.length > 20) {
      setTagError("Название тега не может быть длиннее 20 символов");
      setTagLoading(false);
      return;
    }

    if (!newTagName.trim()) {
      setTagError("Название тега не может быть пустым");
      setTagLoading(false);
      return;
    }

    try {
      const body = new URLSearchParams();
      body.append("name", newTagName);

      const res = await fetch("http://localhost:8000/tags", {
        method: "POST",
        body,
        credentials: "include",
      });

      if (res.ok) {
        const newTag = await res.json();
        setTags([...tags, { idtag: newTag.idtag, name: newTag.name }]);
        setSelectedTags([...selectedTags, newTag.idtag.toString()]);
        setNewTagName("");
        setShowNewTagDialog(false);
      } else {
        const data = await res.json().catch(() => null);
        setTagError(data?.detail || `Ошибка: ${res.status}`);
      }
    } catch (err: any) {
      setTagError(err?.message || "Network error");
    } finally {
      setTagLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Left side: Plus, Home, Tags buttons */}
          <div className="flex items-center gap-4">
            <a href="/new_post" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
              +
            </a>
            <a href="/" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              Главная
            </a>
            <a href="/tags" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              Теги
            </a>
            <a href="/search" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              Поиск
            </a>
          </div>

          {/* Right side: Username and Logout buttons */}
          <div className="flex items-center gap-2">
            <Link href={`/profile/${user.id}`} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              {user.username}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-10 px-10">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-semibold mb-8">Новый пост</h1>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            {/* Title input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Заголовок
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите заголовок поста"
                  className="w-full px-4 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className={`absolute right-4 top-2.5 text-xs pointer-events-none ${title.length >= 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {title.length}/500
                </span>
              </div>
              {title.length >= 500 && (
                <p className="text-xs text-red-500 mt-1">Заголовок должен быть короче 500 символов</p>
              )}
            </div>

            {/* Tags section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Теги
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTagDialog(true);
                    setNewTagName("");
                    setTagError(null);
                  }}
                  className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition"
                >
                  + Новый тег
                </button>
              </div>
              <select
                multiple
                value={selectedTags}
                onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, (option) => option.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tags.length === 0 ? (
                  <option disabled>Нет доступных тегов</option>
                ) : (
                  tags.map((tag) => (
                    <option key={tag.idtag} value={tag.idtag}>
                      {tag.name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Для выбора нескольких тегов используйте Ctrl+Click (или Cmd+Click на Mac)
              </p>
            </div>

            {/* Text area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Текст
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите текст поста"
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
                {error}
              </p>
            )}

            {/* Submit button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || title.length >= 500}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Публикация..." : "Опубликовать"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* New Tag Dialog */}
      {showNewTagDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Создать новый тег</h2>
            <form onSubmit={handleCreateTag}>
              <div className="mb-4">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value.slice(0, 20))}
                  placeholder="Название тега (макс. 20 символов)"
                  maxLength={20}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {newTagName.length} / 20 символов
                </p>
              </div>

              {tagError && (
                <p className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm mb-4">
                  {tagError}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTagDialog(false);
                    setNewTagName("");
                    setTagError(null);
                  }}
                  disabled={tagLoading}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={tagLoading || newTagName.length > 20 || newTagName.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tagLoading ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
