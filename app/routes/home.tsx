import { database } from "~/database/context";
import * as schema from "~/database/schema";

import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { VALUE_FROM_EXPRESS } from "server/app";
import { getUser } from "~/utils/global-context";
import { SuggestionImages } from "~/components/suggestion-images";
import { Sidebar } from "~/components/sidebar";
import { Outlet } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "fashion" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  let name = formData.get("name");
  let email = formData.get("email");
  if (typeof name !== "string" || typeof email !== "string") {
    return { guestBookError: "Name and email are required" };
  }

  name = name.trim();
  email = email.trim();
  if (!name || !email) {
    return { guestBookError: "Name and email are required" };
  }

  const db = database();
  try {
    await db.insert(schema.guestBook).values({ name, email });
  } catch (error) {
    return { guestBookError: "Error adding to guest book" };
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

export default function Home({
  matches,
  actionData,
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-row gap-3 h-full w-full justify-center">
        <Sidebar matches={matches} />
        <div className="flex-1 w-[50vw] flex flex-col items-center justify-start max-w-[800px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
