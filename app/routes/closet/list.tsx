import { Form, Link, useNavigation, useRouteLoaderData } from "react-router";
import type { loader } from "./closet";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import { clothingCategories } from "~/database/schema";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod/v4";
import { Input, InputField } from "~/components/ui/input";
import Button from "~/components/ui/button";
import type { Route } from "./+types/list";
import { uploadClothing } from "~/clothing/clothing.server";
import { eq } from "drizzle-orm";
import * as schema from "~/database/schema";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");
  const db = database();
  const user = getUser();

  if (action === "add") {
    const clothing = await uploadClothing(formData.get("image") as File);
  } else if (action === "clear") {
    await db.delete(schema.clothing).where(eq(schema.clothing.userId, user.id));
  }
}

const resolver = zodResolver(
  z.object({
    image: z.instanceof(File),
  })
);

export default function ClosetList({ actionData }: Route.ComponentProps) {
  const data = useRouteLoaderData<typeof loader>("routes/closet/closet");
  if (!data) {
    throw new Error("Data not found");
  }
  const { inCategories } = data;

  const filledCategories = clothingCategories.filter(
    (category) => inCategories[category].length > 0
  );
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    setAdding(true);
  };

  const handleCancel = () => {
    setAdding(false);
  };

  return (
    <div className="mt-36 w-full">
      <div className="flex flex-row items-center justify-start border-zinc-200 border bg-zinc-100 rounded-md w-fit mx-auto">
        {adding ? (
          <div className="p-2">
            <Form
              method="post"
              className="flex flex-col gap-2"
              encType="multipart/form-data"
            >
              <Input
                name="image"
                type="file"
                required
                className="p-3 border border-zinc-200 rounded-md"
              />
              <div className="flex flex-row gap-2">
                <Button type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="black"
                  disabled={isSubmitting}
                  value="add"
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </Button>
              </div>
            </Form>
          </div>
        ) : (
          <div
            className="w-full h-full cursor-pointer flex items-center justify-center p-5 px-10"
            onClick={handleAdd}
          >
            + Add item
          </div>
        )}
      </div>
      {filledCategories.map((category) => (
        <div key={category} className="mb-10">
          <p className="font-bold font-serif text-xl text-left mb-2 w-1/2">
            {category}
          </p>
          <div className="flex flex-row flex-wrap gap-2">
            {inCategories[category].map((item) => (
              <Link to={`/closet/${item.id}`} key={item.id}>
                <img
                  key={item.id}
                  src={item.previewImg ?? undefined}
                  alt={item.name ?? "Closet Item"}
                  className="w-[100px] h-[100px] object-cover rounded-md"
                />
              </Link>
            ))}
          </div>
        </div>
      ))}
      <Form method="post">
        <Button
          type="submit"
          color="black"
          disabled={isSubmitting}
          value="clear"
        >
          Clear all
        </Button>
      </Form>
    </div>
  );
}
