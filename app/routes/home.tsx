import { database } from "~/database/context";
import * as schema from "~/database/schema";

import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { VALUE_FROM_EXPRESS } from "server/app";
import { getUser } from "~/utils/global-context";
import { SuggestionImages } from "~/components/suggestion-images";
import { Sidebar } from "~/components/sidebar";
import { Outlet } from "react-router";
import { uploadClothing } from "~/clothing/clothing.server";
import ImageDragHandler from "~/components/draghandler";

export function meta({}: Route.MetaArgs) {
  return [{ title: "fashion" }];
}
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const image = formData.get("image") as File;

  if (image.type && !image.type.startsWith("image/")) {
    return {
      success: false,
      error: "Only image files can be added to your closet.",
    };
  }

  try {
    console.log("uploading clothing", image);
    const clothing = await uploadClothing(image);
    return { success: true, clothingId: clothing.id };
  } catch (error) {
    console.error("Global clothing upload failed", error);
    return {
      success: false,
      error: "Couldn't upload that item. Please try again.",
    };
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = database();

  const user = getUser();

  const guestBook = await db.query.guestBook.findMany({
    columns: {
      id: true,
      name: true,
    },
  });

  return {
    guestBook,
    message: context.get(VALUE_FROM_EXPRESS),
    user,
  };
}

export default function Home({ matches }: Route.ComponentProps) {
  return (
    <div className="flex flex-row min-h-screen h-fitcontent flex-nowrap bg-pagebg bg-[#fcfcfc]">
      <Sidebar matches={matches} />
      <div className="flex-1 relative">
        <Outlet />
      </div>
      <ImageDragHandler />
    </div>
  );
}
