function Base({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-xl ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-border space-y-3">
      <div className="flex items-center gap-3">
        <Base className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Base className="h-3 w-32" />
          <Base className="h-2.5 w-20" />
        </div>
      </div>
      <Base className="h-3 w-full" />
      <Base className="h-3 w-4/5" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Base className="w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Base className="h-3.5 w-28" />
        <Base className="h-3 w-44" />
      </div>
    </div>
  );
}

export function DiscoverSkeleton() {
  return (
    <div className="p-4 rounded-3xl border border-border overflow-hidden">
      <Base className="w-full aspect-[3/4] rounded-2xl mb-3" />
      <Base className="h-5 w-40 mb-2" />
      <Base className="h-3.5 w-full" />
      <Base className="h-3.5 w-3/4 mt-1" />
    </div>
  );
}

export default Base;
