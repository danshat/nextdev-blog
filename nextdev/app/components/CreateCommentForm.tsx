"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  postId: number;
  parentId?: number;
  onCommentCreated?: () => void;
}

export default function CreateCommentForm({ postId, parentId, onCommentCreated }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (text.length === 0) {
      setError("Комментарий не может быть пустым");
      return;
    }

    if (text.length >= 1000) {
      setError("Комментарий должен быть короче 1000 символов");
      return;
    }

    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("text", text);
      if (parentId) {
        body.append("parent_id", parentId.toString());
      }

      const res = await fetch(`http://localhost:8000/posts/${postId}/comments`, {
        method: "POST",
        body: body,
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (res.ok) {
        setText("");
        onCommentCreated?.();
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Ошибка при отправке комментария");
      }
    } catch (err) {
      setError("Ошибка сети при отправке комментария");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={parentId ? "mt-4" : "mt-6"}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {parentId ? "Ответить..." : "Оставить комментарий"}
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        rows={parentId ? 3 : 4}
        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white"
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <div className="mt-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-semibold transition"
        >
          {loading ? "Отправка..." : parentId ? "Ответить" : "Оставить комментарий"}
        </button>
      </div>
    </form>
  );
}
