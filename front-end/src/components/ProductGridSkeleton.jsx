const ProductGridSkeleton = ({
  count = 8,
  className = "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}) => {
  return (
    <div
      className={`grid justify-items-center ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <article
          key={index}
          className="w-full min-w-0 max-w-[340px] overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 p-2"
        >
          <div className="h-[180px] animate-pulse rounded-xl bg-zinc-700/60 sm:h-[210px] md:h-[240px]" />
          <div className="space-y-3 px-2 py-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-700/60" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
            <div className="h-5 w-2/5 animate-pulse rounded bg-zinc-700/60" />
          </div>
        </article>
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
