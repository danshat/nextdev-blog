"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateUsername = (name: string): string | null => {
    if (name.length >= 25) {
      return "Логин должен быть короче 25 символов";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return "Логин может содержать только буквы, цифры и подчеркивание";
    }
    return null;
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length <= 8) {
      return "Пароль должен быть длиннее 8 символов";
    }
    if (pwd.length >= 20) {
      return "Пароль должен быть короче 20 символов";
    }
    return null;
  };

  const validatePasswordMatch = (pwd: string, confirm: string): string | null => {
    if (pwd !== confirm) {
      return "Пароли не совпадают";
    }
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Frontend validation
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const matchError = validatePasswordMatch(password, passwordConfirm);
    if (matchError) {
      setError(matchError);
      return;
    }

    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        body,
        credentials: "include",
      });

      if (res.ok) {
        // Registration succeeded and cookie should be set by backend. Redirect to root.
        window.location.href = "/";
        return;
      }

      if (res.status === 400) {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка регистрации");
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
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Регистрация в NextDev</h1>
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
            <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              До 25 символов, только буквы, цифры и подчеркивание
            </span>
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
            <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              От 9 до 19 символов
            </span>
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1 text-zinc-700 dark:text-zinc-300">Подтверждение пароля</span>
            <input
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
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
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            Войти
          </Link>
        </p>
      </main>
    </div>
  );
}
