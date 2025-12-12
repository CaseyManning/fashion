import type { Route } from "./+types/closet";
import { Form, Link, Outlet, useLoaderData, useNavigation } from "react-router";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import { eq, type InferSelectModel } from "drizzle-orm";
import * as schema from "~/database/schema";
import { clothingCategories } from "~/database/schema";
import Button from "~/components/ui/button";
import { uploadClothing } from "~/clothing/clothing.server";
import Loading from "~/components/ui/loading";
import { presignClothingList } from "~/utils/presign";

export function meta({}: Route.MetaArgs) {
  return [{ title: "closet" }];
}
export type Clothing = InferSelectModel<typeof schema.clothing>;
type ClothingCategory = (typeof schema.clothingCategory.enumValues)[number];

export async function loader() {
  const db = database();
  const user = getUser();

  const items = await db.query.clothing.findMany({
    where: eq(schema.clothing.userId, user.id),
  });

  const itemsWithSignedPreview = await presignClothingList(items);

  const inCategories: Record<ClothingCategory, Clothing[]> = Object.fromEntries(
    schema.clothingCategory.enumValues.map((key) => [key, [] as Clothing[]])
  ) as Record<ClothingCategory, Clothing[]>;

  for (const item of itemsWithSignedPreview) {
    inCategories[item.category].push(item);
  }
  for (const [category, items] of Object.entries(inCategories)) {
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const clothesList = Object.values(inCategories).flat();

  return { inCategories, clothesList };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");
  const db = database();
  const user = getUser();

  if (action === "add") {
    await uploadClothing(formData.get("image") as File);
  } else if (action === "clear") {
    await db.delete(schema.clothing).where(eq(schema.clothing.userId, user.id));
  }
}

export default function ClosetList({ actionData }: Route.ComponentProps) {
  const data = useLoaderData<typeof loader>();
  if (!data) {
    throw new Error("Data not found");
  }
  const { inCategories } = data;

  const filledCategories = clothingCategories.filter(
    (category) => inCategories[category].length > 0
  );
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <>
      <div className="w-full p-5 lg:p-15 mx-auto">
        {filledCategories.map((category) => (
          <div key={category} className="mb-10">
            <p className="font-bold font-serif text-xl text-left mb-2 w-1/2">
              {category}
            </p>
            <div className="flex flex-row flex-wrap gap-2">
              {inCategories[category].map((item) => (
                <Link
                  to={`/closet/${item.id}`}
                  key={item.id}
                  className="hover:border-zinc-900 border border-transparent relative w-[100px] h-[100px] p-2"
                >
                  {item.previewImg && (
                    <img
                      key={item.id}
                      src={item.previewImg ?? undefined}
                      className="object-contain rounded-md w-full h-full"
                    />
                  )}
                  {item.processing ? (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-zinc-100/50 rounded-md">
                      <Loading />
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <p className="text-sm text-zinc-500 mb-5">
          Drag a photo to add it to your closet
        </p>
        {/* <Form method="post">
          <Button
            type="submit"
            color="black"
            disabled={isSubmitting}
            value="clear"
          >
            Clear all
          </Button>
        </Form> */}
      </div>
      <Outlet />
    </>
  );
}
