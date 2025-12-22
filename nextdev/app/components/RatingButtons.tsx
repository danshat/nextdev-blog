'use client';

import { useState, useEffect } from 'react';

interface RatingButtonsProps {
  postId: number;
  initialRating: number;
  isBanned: boolean;
}

export default function RatingButtons({ postId, initialRating, isBanned }: RatingButtonsProps) {
  const [rating, setRating] = useState(initialRating);
  const [userRating, setUserRating] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's current rating
  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/user-rating`);
        const data = await res.json();
        if (data.rated) {
          setUserRating(data.is_positive);
        }
      } catch (error) {
        console.error('Failed to fetch user rating:', error);
      }
    };

    fetchUserRating();
  }, [postId]);

  const handleRate = async (isPositive: boolean) => {
    if (isBanned) {
      alert('Banned users cannot rate posts');
      return;
    }

    setIsLoading(true);
    try {
      // If already rated with same value, remove it
      if (userRating === isPositive) {
        const res = await fetch(`/api/posts/${postId}/rate`, {
          method: 'DELETE',
        });

        if (res.ok) {
          const data = await res.json();
          setRating(data.rating);
          setUserRating(null);
        }
      } else {
        // Otherwise, create/update rating
        const formData = new FormData();
        formData.append('is_positive', String(isPositive));

        const res = await fetch(`/api/posts/${postId}/rate`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setRating(data.rating);
          setUserRating(isPositive);
        }
      }
    } catch (error) {
      console.error('Failed to rate post:', error);
      alert('Failed to rate post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleRate(true)}
        disabled={isLoading || isBanned}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition ${
          userRating === true
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-200 dark:hover:bg-green-900'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isBanned ? 'Banned users cannot rate' : 'Upvote'}
      >
        <span>⬆️</span>
      </button>

      <span className="font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
        {rating > 0 ? '+' : ''}{rating}
      </span>

      <button
        onClick={() => handleRate(false)}
        disabled={isLoading || isBanned}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition ${
          userRating === false
            ? 'bg-red-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-200 dark:hover:bg-red-900'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isBanned ? 'Banned users cannot rate' : 'Downvote'}
      >
        <span>⬇️</span>
      </button>
    </div>
  );
}
