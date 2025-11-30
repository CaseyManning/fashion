import { eq } from "drizzle-orm";
import { href, Link, useLoaderData } from "react-router";
import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { LightboxCard } from "~/components/ligthbox-card";
import type { Route } from "./+types/outfit";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Error("No id provided");
  }
  const db = database();
  const outfit = await db.query.outfitGenerations.findFirst({
    where: eq(schema.outfitGenerations.id, id),
    with: {
      outfitsToClothing: {
        with: {
          clothing: true,
        },
      },
    },
  });
  if (!outfit) {
    throw new Error("Outfit not found");
  }
  return { outfit };
}

const sortOrder: Record<(typeof schema.clothingCategories)[number], number> = {
  outerwear: 0,
  tops: 1,
  bottoms: 2,
  dresses: 3,
  accessories: 4,
  shoes: 5,
  bags: 6,
  hats: 7,
  other: 8,
} as const;

const zOrder: Record<(typeof schema.clothingCategories)[number], number> = {
  outerwear: 1,
  tops: 2,
  bottoms: 1,
  dresses: 3,
  accessories: 4,
  shoes: 5,
  bags: 6,
  hats: 7,
  other: 8,
} as const;

export default function Outfit() {
  const { outfit } = useLoaderData<typeof loader>();
  console.log(outfit);
  const sortedClothing = outfit.outfitsToClothing.sort((a, b) => {
    return sortOrder[a.clothing.category] - sortOrder[b.clothing.category];
  });
  return (
    <LightboxCard closeOnEscape={true}>
      <img
        src={outfit.image ?? ""}
        alt={outfit.prompt ?? ""}
        className="rounded-l-md mr-10"
      />
      <div className="flex flex-col gap-4 flex-1 w-[150px]">
        <div className="w-[150px] h-full flex flex-col gap-2 justify-center">
          {sortedClothing.map((outfitToClothing, idx, array) => {
            const x = 0;
            const rotation = 0;
            const y = idx / array.length;
            return (
              <Link
                key={outfitToClothing.clothingId}
                className="w-full hover:border-black border border-transparent p-1"
                to={href("/closet/:id", { id: outfitToClothing.clothingId })}
              >
                <img
                  src={outfitToClothing.clothing.previewImg ?? ""}
                  alt={outfitToClothing.clothing.name ?? ""}
                  className="object-contain"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </LightboxCard>
  );
}
