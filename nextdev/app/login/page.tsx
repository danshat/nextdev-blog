"use client"

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        body,
        credentials: "include",
      });

      if (res.ok) {
        // Login succeeded and cookie should be set by backend. Redirect to root.
        window.location.href = "/";
        return;
      }

      if (res.status === 401) {
        setError("Неверные учетные данные");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <main className="w-full max-w-md rounded-xl bg-gray-50 p-10 shadow-md dark:bg-gray-800">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="NextDev logo" width={80} height={80} className="block" />
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Войти в NextDev</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Самый инновационный IT-блог</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex w-full flex-col gap-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-zinc-700 dark:text-zinc-300">Логин</span>
            <input
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              required
              placeholder="Ваш логин"
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#0b0b0b] dark:border-zinc-800 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1 text-zinc-700 dark:text-zinc-300">Пароль</span>
            <input
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="*********"
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#0b0b0b] dark:border-zinc-800 dark:text-zinc-50"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            Зарегистрироваться
          </Link>
        </p>

        {/* Test Accounts Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-sm">
            📝 Тестовые аккаунты для разработки:
          </h3>
          <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-fit">Администратор:</span>
              <span>логин: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin</code>, пароль: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin</code></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-fit">Модератор:</span>
              <span>логин: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">moderator</code>, пароль: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">moderator</code></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-fit">Пользователь:</span>
              <span>логин: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">user</code>, пароль: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">user</code></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
