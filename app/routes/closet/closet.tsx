import { SuggestionImages } from "~/components/suggestion-images";
import type { Route } from "./+types/closet";
import { Outlet } from "react-router";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import { eq, type InferSelectModel } from "drizzle-orm";
import * as schema from "~/database/schema";

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

  const inCategories: Record<ClothingCategory, Clothing[]> = Object.fromEntries(
    schema.clothingCategory.enumValues.map((key) => [key, [] as Clothing[]])
  ) as Record<ClothingCategory, Clothing[]>;

  for (const item of items) {
    inCategories[item.category].push(item);
  }

  return { inCategories };
}

export default function Closet() {
  return <Outlet />;
}
