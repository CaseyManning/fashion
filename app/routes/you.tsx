import { Form, useLoaderData, useSubmit } from "react-router";
import type { Route } from "./+types/you";
import { Input } from "~/components/ui/input";
import { getUser } from "~/utils/global-context";
import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { eq } from "drizzle-orm";
import { Plus, X } from "lucide-react";
import AutosaveForm from "~/components/ui/AutosaveForm";
import { useRef } from "react";
import { processAndSave } from "~/utils/images.server";
import Button from "~/components/ui/button";

export async function loader({}: Route.LoaderArgs) {
  const db = database();
  const user = getUser();

  const withPhotos = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
    with: {
      bodyPhotos: true,
      inspoPhotos: true,
    },
  });
  if (!withPhotos) {
    throw new Error("User not found");
  }

  return { user: withPhotos };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");

  const db = database();
  const user = getUser();

  if (action === "addBodyPhoto") {
    console.log("addBodyPhoto");
    const file = formData.get("bodyPhoto") as File;
    if (file) {
      const saved = await processAndSave(Buffer.from(await file.arrayBuffer()));
      console.log("saved", saved);
      await db.insert(schema.bodyPhotos).values({
        userId: user.id,
        key: saved.relativePath,
      });
    }
  } else if (action === "deleteBodyPhoto") {
    const id = formData.get("id") as string;
    await db.delete(schema.bodyPhotos).where(eq(schema.bodyPhotos.id, id));
  } else if (action === "saveStats") {
    const data = Object.fromEntries(formData);
    await db.update(schema.users).set(data).where(eq(schema.users.id, user.id));
  }
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "you" }];
}

export default function You() {
  const bodyPhotoRef = useRef<HTMLFormElement>(null);
  const inspoPhotoRef = useRef<HTMLFormElement>(null);
  const handleAddBodyPhoto = () => {
    bodyPhotoRef.current?.requestSubmit();
  };
  const handleAddInspoPhoto = () => {
    inspoPhotoRef.current?.requestSubmit();
  };

  const submit = useSubmit();

  const handleDelete = (id: string) => {
    submit({ _action: "deleteBodyPhoto", id }, { method: "post" });
  };

  const { user } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col p-4 items-center justify-center h-screen">
      <div className="flex flex-col gap-4">
        <p className="text-2xl font-semibold text-black font-serif w-full">
          Stats
        </p>
        <AutosaveForm
          action="saveStats"
          method="post"
          className="flex flex-col gap-4 *:flex *:flex-row *:gap-4"
        >
          <div>
            <Input
              type="text"
              name="height"
              placeholder="Height"
              defaultValue={user.height ?? ""}
            />
            <Input
              type="text"
              name="weight"
              placeholder="Weight"
              defaultValue={user.weight ?? ""}
            />
            <Input
              type="text"
              name="waist"
              placeholder="Waist"
              defaultValue={user.waist ?? ""}
            />
          </div>
          <div>
            <Input
              type="text"
              name="bust"
              placeholder="Bust"
              defaultValue={user.bust ?? ""}
            />
            <Input
              type="text"
              name="hip"
              placeholder="Hip"
              defaultValue={user.hip ?? ""}
            />
          </div>
        </AutosaveForm>
        <p className="text-2xl font-semibold text-black font-serif w-full">
          Photos
        </p>
        <div className="flex flex-row gap-4">
          {user.bodyPhotos.map((photo) => (
            <div className="relative group" key={photo.id}>
              <img src={photo.key ?? ""} className="w-30 h-40" />
              <Button
                color="light"
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-2!"
              >
                <X size={20} />
              </Button>
            </div>
          ))}
          <div className="w-30 h-40 border flex items-center justify-center hover:bg-zinc-200/60 transition-colors duration-200 relative cursor-pointer">
            <Form
              method="post"
              encType="multipart/form-data"
              ref={bodyPhotoRef}
              className="absolute w-full h-full"
            >
              <input
                type="hidden"
                name="_action"
                value="addBodyPhoto"
                className="hidden"
              />
              <input
                type="file"
                name="bodyPhoto"
                className="absolute w-full h-full opacity-0 cursor-pointer"
                onChange={handleAddBodyPhoto}
              />
            </Form>
            <Plus size={20} className="pointer-events-none" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-black font-serif w-full">
          Style references
        </p>
        <div className="flex flex-row gap-4">
          {user.inspoPhotos.map((photo) => (
            <div className="relative group" key={photo.id}>
              <img src={photo.key ?? ""} className="w-30 h-40" />
              <Button
                color="light"
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-2!"
              >
                <X size={20} />
              </Button>
            </div>
          ))}
          <div className="w-30 h-40 border flex items-center justify-center hover:bg-zinc-200/60 transition-colors duration-200 relative cursor-pointer">
            <Form
              method="post"
              encType="multipart/form-data"
              ref={inspoPhotoRef}
              className="absolute w-full h-full"
            >
              <input
                type="hidden"
                name="_action"
                value="addInspoPhoto"
                className="hidden"
              />
              <input
                type="file"
                name="inspoPhoto"
                className="absolute w-full h-full opacity-0 cursor-pointer"
                onChange={handleAddInspoPhoto}
              />
            </Form>
            <Plus size={20} className="pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
