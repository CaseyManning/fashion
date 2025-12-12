import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { SuggestionImages } from "~/components/suggestion-images";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import * as schema from "~/database/schema";
import { useLoaderData } from "react-router";
import Button from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { presignList, presignMaybeKey } from "~/utils/presign";

export async function loader() {
  const db = database();
  const user = getUser();

  const outfits = await db.query.outfitGenerations.findMany({
    where: eq(schema.outfitGenerations.userId, user.id),
    orderBy: desc(schema.outfitGenerations.createdAt),
    limit: 3,
  });

  const outfitsWithSignedImages = await presignList(
    outfits,
    async (outfit) => ({
      ...outfit,
      image: (await presignMaybeKey(outfit.image)) ?? null,
    })
  );

  return { outfits: outfitsWithSignedImages };
}

export default function Inspo() {
  const { outfits } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div>
        <SuggestionImages outfits={outfits} />
        <div className="flex flex-row items-center justify-between px-2">
          <div></div>
          <div className="flex flex-row items-center justify-center gap-1">
            <Button color="transparent" onClick={() => {}}>
              <ChevronLeft size={20} />
            </Button>
            <Button color="transparent" onClick={() => {}}>
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
