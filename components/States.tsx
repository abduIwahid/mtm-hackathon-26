export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-border"
          style={{ width: `${92 - i * 14}%` }}
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, line }: { title: string; line: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{line}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
      <p className="font-medium text-[var(--danger)]">Something went wrong</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 h-10 rounded-lg bg-accent px-4 font-medium text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}
