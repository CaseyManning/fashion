import type { InferSelectModel } from "drizzle-orm";
import { href, Link } from "react-router";
import * as schema from "~/database/schema";

export type SuggestionImagesProps = {
  outfits: InferSelectModel<typeof schema.outfitGenerations>[];
};
export function SuggestionImages({ outfits }: SuggestionImagesProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-5">
      {outfits.map((outfit) => (
        <Link key={outfit.id} to={href("/outfit/:id", { id: outfit.id })}>
          <img
            src={outfit.image ?? ""}
            alt="Outfit"
            className="h-[70vh] w-auto object-contain"
          />
        </Link>
      ))}
    </div>
  );
}
