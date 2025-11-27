export default function ClosetList() {
  const categories = [
    "tops",
    "bottoms",
    "accessories",
    "shoes",
    "bags",
    "hats",
    "gloves",
    "scarves",
  ];
  return (
    <div className="mt-36">
      {categories.map((category) => (
        <div key={category} className="mb-10">
          <p className="font-bold font-serif text-xl text-left mb-2 w-1/2">
            {category}
          </p>
          <div className="flex flex-row flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <img
                key={index}
                src={`https://picsum.photos/300/500?random=${index}`}
                alt="Closet Item"
                className="w-[100px] h-[100px] object-cover"
              />
            ))}
            <div className="cursor-pointer w-[100px] h-[100px] bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center text-2xl">
              <p className="text-zinc-500 pb-1 font-light">+</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
