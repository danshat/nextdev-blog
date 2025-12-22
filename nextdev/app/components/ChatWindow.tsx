'use client';

import { useState, useEffect, useRef } from 'react';
import { User, PrivateMessage } from '@/app/lib/types';

interface ChatWindowProps {
  currentUser: User;
  otherUser: User;
}

export default function ChatWindow({ currentUser, otherUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  // Fetch conversation
  useEffect(() => {
    const fetchConversation = async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);
        const res = await fetch(`/api/messages/${otherUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          lastMessageCountRef.current = data.length;
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch conversation:', err);
        setError('Failed to load messages');
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchConversation(true);
    
    // Poll for new messages every 3 seconds, but don't show loading state
    const interval = setInterval(() => fetchConversation(false), 3000);
    return () => clearInterval(interval);
  }, [otherUser.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (currentUser.is_banned) {
      setError('Заблокированные пользователи не могут отправлять сообщения');
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('text', newMessage);

      const res = await fetch(`/api/messages/${otherUser.id}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setNewMessage('');
        setError(null);
        // Refresh conversation
        const conversationRes = await fetch(`/api/messages/${otherUser.id}`);
        if (conversationRes.ok) {
          const data = await conversationRes.json();
          setMessages(data);
        }
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{otherUser.username}</h3>
        {otherUser.is_banned && (
          <p className="text-xs text-red-600 dark:text-red-400">Banned</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Пока здесь пусто. Скажите "Привет"!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.user_from === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.user_from === currentUser.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <p className="text-xs mt-1 opacity-70">{msg.date}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {currentUser.is_banned ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Заблокированные пользователя не могут отправлять сообщения.
          </p>
        ) : otherUser.is_banned ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Невозможно отправить сообщение этому пользователю, так как он заблокирован.
          </p>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите что-нибудь..."
              maxLength={5000}
              disabled={isSending}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition"
            >
              {isSending ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
