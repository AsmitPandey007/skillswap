export default function StarRating({ value = 0, onChange, readOnly = false, size = "md" }) {
  const sizeClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className={`flex gap-1 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`transition ${
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } ${star <= value ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({ rating = 0, count = 0, size = "sm" }) {
  if (!count) {
    return <span className="text-sm text-gray-500 dark:text-gray-400">No ratings yet</span>;
  }

  const rounded = Math.round(rating);
  const sizeClass = size === "lg" ? "text-xl" : "text-base";

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass} text-amber-500`}>
      <span>{"★".repeat(rounded)}{"☆".repeat(5 - rounded)}</span>
      <span className="text-gray-600 dark:text-gray-300 font-medium">
        {rating.toFixed(1)} ({count})
      </span>
    </span>
  );
}
