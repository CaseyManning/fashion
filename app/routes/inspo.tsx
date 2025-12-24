import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { SuggestionImages } from "~/components/suggestion-images";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import * as schema from "~/database/schema";
import { useLoaderData, useSubmit } from "react-router";
import Button from "~/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import { presignList, presignMaybeKey } from "~/utils/presign";
import type { Route } from "./+types/inspo";
import { createRandomOutfits } from "~/clothing/clothing.server";

export async function loader() {
  const db = database();
  const user = getUser();

  const outfits = await db.query.outfitGenerations.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
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

export async function action({ request }: Route.ActionArgs) {
  const db = database();
  const user = getUser();
  const outfits = await createRandomOutfits(3);
  return { outfits };
}

export default function Inspo() {
  const { outfits } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const handleRefresh = () => {
    submit({ _action: "refresh" }, { method: "post" });
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="p-5">
        <SuggestionImages outfits={outfits} />
        <div className="flex flex-row items-center justify-between mt-3">
          <Button color="transparent" onClick={handleRefresh}>
            <RefreshCcw size={20} />
          </Button>
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
