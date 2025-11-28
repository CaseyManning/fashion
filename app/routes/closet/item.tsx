import { eq } from "drizzle-orm";
import { database } from "~/database/context";
import type { Route } from "./+types/item";
import * as schema from "~/database/schema";
import Button from "~/components/ui/button";
import { Form } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Error("No id provided");
  }
  const db = database();
  const clothing = await db.query.clothing.findFirst({
    where: eq(schema.clothing.id, id),
  });
  if (!clothing) {
    throw new Error("item not found");
  }
  return { clothing };
}

const ClosetItem = ({ loaderData }: Route.ComponentProps) => {
  const { clothing } = loaderData;
  console.log(clothing);
  return (
    <div className="flex flex-row mt-36">
      <div className="flex-1 shrink-0">
        <img
          src={clothing.previewImg ?? undefined}
          className="h-[500px] w-auto object-contain"
        />
      </div>
      <div>
        <Form method="post">
          <div className="flex flex-row gap-2">
            <input
              type="text"
              placeholder="give it a name"
              className="border border-black p-3 focus:ring-0 focus:outline-none"
              name="name"
              defaultValue={clothing.name ?? ""}
            />
            <input
              type="text"
              placeholder="brand?"
              className="border border-black p-3 focus:ring-0 focus:outline-none"
              name="brand"
              defaultValue={clothing.brand ?? ""}
            />
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ClosetItem;
