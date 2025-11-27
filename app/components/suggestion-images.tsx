export type SuggestionImagesProps = {
  rows?: number;
  columns?: number;
};
export function SuggestionImages({
  rows = 1,
  columns = 3,
}: SuggestionImagesProps) {
  return (
    <div className="flex flex-col items-stretch justify-center gap-5 mt-36">
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex flex-row items-center justify-center gap-5"
        >
          {Array.from({ length: columns }).map((_, column) => (
            <div
              key={column}
              className="flex-1 flex flex-col items-center justify-center gap-1"
            >
              <img
                src={`https://picsum.photos/300/500?random=${row}-${column}`}
                alt="Suggestion Image"
                className={`object-cover w-full`}
              />
              <div className="w-full h-2 flex flex-row items-center justify-end">
                <div className="w-8 h-full bg-cyan-500" />
                <div className="w-8 h-full bg-yellow-500" />
                <div className="w-8 h-full bg-black" />
                <div className="w-8 h-full bg-rose-500" />
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-row justify-between items-center w-full px-3">
        <div>{"< >"}</div>
        <div className="flex flex-col items-end">
          <p className="font-bold font-serif text-lg">
            Outfits for Wednesday, Nov. 26
          </p>
          <p className="text-zinc-500 font-medium font-serif">
            Refreshes in 12 hours
          </p>
        </div>
      </div>
    </div>
  );
}
