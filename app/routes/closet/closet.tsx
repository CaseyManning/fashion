import { SuggestionImages } from "~/components/suggestion-images";
import type { Route } from "./+types/closet";
import { Outlet } from "react-router";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";

export function meta({}: Route.MetaArgs) {
  return [{ title: "closet" }];
}

export function loader() {
  const db = database();
  const user = getUser();
}

export default function Closet() {
  return <Outlet />;
}
