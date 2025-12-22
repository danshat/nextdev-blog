export interface RatingPlaqueProps {
  rating: number | undefined;
}

export default function RatingPlaque({ rating }: RatingPlaqueProps) {
  if (rating === undefined) return null;

  const displayRating = rating > 0 ? `+${rating}` : String(rating);
  const isPositive = rating > 0;
  const isNeutral = rating === 0;
  const isNegative = rating < 0;

  return (
    <div
      className={`absolute top-4 right-4 px-3 py-1 rounded-lg font-semibold text-sm transition ${
        isPositive
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
          : isNegative
          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      }`}
      title="Post rating"
    >
      {displayRating}
    </div>
  );
}
