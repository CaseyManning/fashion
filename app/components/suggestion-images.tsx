export type SuggestionImagesProps = {
  rows?: number;
  columns?: number;
};
export function SuggestionImages({
  rows = 2,
  columns = 2,
}: SuggestionImagesProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-5">
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex flex-row items-center justify-center w-full gap-5"
        >
          {Array.from({ length: columns }).map((_, column) => (
            <div
              key={column}
              className="flex flex-col items-center justify-center gap-1"
            >
              <img
                src={`https://picsum.photos/200/300?random=${row}-${column}`}
                alt="Suggestion Image"
                className="w-[40vh] h-[40vh] object-cover"
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
    </div>
  );
}
