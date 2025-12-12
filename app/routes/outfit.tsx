import { eq } from "drizzle-orm";
import {
  href,
  Link,
  redirect,
  useLoaderData,
  useNavigate,
  useSubmit,
} from "react-router";
import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { LightboxCard } from "~/components/ligthbox-card";
import type { Route } from "./+types/outfit";
import Button from "~/components/ui/button";
import { X } from "lucide-react";
import { presignOutfit } from "~/utils/presign";

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
  return { outfit: await presignOutfit(outfit) };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { id } = params;
  if (!id) {
    throw new Error("No id provided");
  }
  const action = formData.get("_action");
  if (action === "delete") {
    const db = database();
    await db
      .delete(schema.outfitGenerations)
      .where(eq(schema.outfitGenerations.id, id));
    return true;
  }
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

export default function Outfit() {
  const { outfit } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const sortedClothing = outfit.outfitsToClothing.sort((a, b) => {
    return sortOrder[a.clothing.category] - sortOrder[b.clothing.category];
  });
  const submit = useSubmit();
  const handleDelete = () => {
    submit({ _action: "delete" }, { method: "post" }).then(() => {
      navigate(-1); //TODO: refactor to fetcher so nav doesnt happen automatically
    });
  };
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
      <div className="absolute top-4 right-4 flex flex-row gap-2">
        <Button
          className="p-2!"
          color="transparent"
          onClick={() => navigate(-1)}
        >
          <X size={20} />
        </Button>
      </div>
      <div className="absolute bottom-4 right-4 flex flex-row gap-2">
        <Button color="black" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </LightboxCard>
  );
}
