import { eq } from "drizzle-orm";
import { database } from "~/database/context";
import type { Route } from "./+types/item";
import * as schema from "~/database/schema";
import Button from "~/components/ui/button";
import {
  Form,
  href,
  redirect,
  useNavigate,
  useRouteLoaderData,
} from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import type { loader as closetLoader } from "./closet";
import { addClothingPhoto } from "~/clothing/clothing.server";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Error("No id provided");
  }
  const db = database();
  const clothing = await db.query.clothing.findFirst({
    where: eq(schema.clothing.id, id),
    with: {
      uploadedPhotos: true,
    },
  });
  if (!clothing) {
    throw new Error("item not found");
  }
  return { clothing };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");
  const { id } = params;
  if (!id) {
    throw new Error("No id provided");
  }
  const db = database();
  if (action === "delete") {
    await db.delete(schema.clothing).where(eq(schema.clothing.id, id));
    return redirect(href("/closet"));
  } else if (action === "add") {
    await addClothingPhoto(formData.get("image") as File, id);
  } else {
    await db
      .update(schema.clothing)
      .set({
        name: formData.get("name") as string,
        brand: formData.get("brand") as string,
        category: formData.get(
          "category"
        ) as (typeof schema.clothingCategory.enumValues)[number],
        notes: formData.get("notes") as string,
      })
      .where(eq(schema.clothing.id, id));
  }
}

const ClosetItem = ({ loaderData }: Route.ComponentProps) => {
  const { clothing } = loaderData;

  const closetData = useRouteLoaderData<typeof closetLoader>(
    "routes/closet/closet"
  );
  if (!closetData) {
    throw new Error("Closet data not found");
  }
  const { asList } = closetData;
  const index = asList.findIndex((item) => item.id === clothing.id);
  const nextItem = (index < asList.length - 1 ? asList[index + 1] : asList[0])
    ?.id;
  const prevItem = (index > 0 ? asList[index - 1] : asList[asList.length - 1])
    ?.id;

  const navigate = useNavigate();

  const navigateLeft = useCallback(() => {
    navigate(href("/closet/:id", { id: prevItem }));
  }, [prevItem]);

  const navigateRight = useCallback(() => {
    navigate(href("/closet/:id", { id: nextItem }));
  }, [nextItem]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        navigate("/closet");
      }
      if (e.key === "ArrowRight") {
        navigateRight();
      }
      if (e.key === "ArrowLeft") {
        navigateLeft();
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [navigate, navigateLeft, navigateRight]);

  const formRef = useRef<HTMLFormElement>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const onChange = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 500);
  };

  const [viewingUpload, setViewingUpload] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(() => {
    setUploading(true);
  }, []);

  useEffect(() => {
    setViewingUpload(null);
  }, [clothing.id]);

  return (
    <div
      className="flex flex-row absolute top-0 left-0 w-full h-full bg-black/5 z-10"
      key={clothing.id}
    >
      <div className="flex flex-row gap-4 bg-white m-10 rounded-md p-4 w-full border border-zinc-200 shadow-xl/5">
        <div className="flex-1 shrink-0 ml-5 relative flex flex-col">
          <div className="min-h-0 flex-1">
            {viewingUpload ? (
              <div className="h-full flex items-center justify-center relative  p-5 lg:p-15 group">
                <img
                  src={viewingUpload}
                  className="w-auto object-contain drop-shadow-2xl/20 h-full"
                />
                <div
                  className="absolute top-0 right-5 p-5 bg-white cursor-pointer rounded-bl-md flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity duration-50"
                  onClick={() => setViewingUpload(null)}
                >
                  <X size={20} />
                </div>
              </div>
            ) : (
              <img
                src={clothing.previewImg ?? undefined}
                className="w-auto object-contain drop-shadow-2xl/20 h-full p-5 lg:p-15"
              />
            )}
          </div>
          <div className="h-[100px] pb-5 flex flex-row items-center shrink-0 cursor-pointer gap-3">
            {clothing.uploadedPhotos.map((photo) => (
              <img
                src={photo.key ?? undefined}
                className="h-full"
                key={photo.id}
                onClick={() => setViewingUpload(clothing.uploadedPhotos[0].key)}
              />
            ))}
            <div className="relative">
              <Button
                className="p-2! m-3"
                color="transparent"
                onClick={handleUpload}
              >
                <Plus size={18} />
              </Button>
              {uploading && (
                <div className="absolute bottom-0 left-0 translate-x-10 -translate-y-10 bg-white shadow-lg/5 rounded-md">
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
                        <Button
                          type="button"
                          onClick={() => setUploading(false)}
                          color="light"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" color="black" value="add">
                          Add
                        </Button>
                      </div>
                    </Form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-start justify-center relative gap-4">
          <div className="absolute top-0 right-0 flex flex-row gap-2">
            <Button className="p-2!" color="transparent" onClick={navigateLeft}>
              <ArrowLeft size={20} />
            </Button>
            <Button
              className="p-2!"
              color="transparent"
              onClick={navigateRight}
            >
              <ArrowRight size={20} />
            </Button>
            <Button
              className="p-2!"
              color="transparent"
              onClick={() => navigate("/closet")}
            >
              <X size={20} />
            </Button>
          </div>
          <Form
            method="post"
            className="flex flex-col gap-4"
            ref={formRef}
            onChange={onChange}
            key={clothing.id}
          >
            <div className="flex flex-row gap-4">
              <Input
                inputStyle="outline"
                type="text"
                placeholder="give it a name"
                name="name"
                defaultValue={clothing.name ?? ""}
              />
              <Input
                inputStyle="outline"
                type="text"
                placeholder="brand?"
                name="brand"
                defaultValue={clothing.brand ?? ""}
              />
            </div>
            <div className="flex flex-row gap-4">
              <select
                name="category"
                defaultValue={clothing.category ?? ""}
                className="border border-zinc-500 p-3 focus:ring-0 focus:outline-none w-full"
              >
                {schema.clothingCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Input
                inputStyle="outline"
                type="text"
                placeholder="favorability"
                name="favorability"
                defaultValue={clothing.rating ?? ""}
              />
            </div>
            <textarea
              className="border border-zinc-500 p-3 focus:ring-0 focus:outline-none"
              rows={2}
              placeholder="dimensions / sizing?"
              name="dimensions"
              defaultValue={clothing.dimensions ?? ""}
            />
            <textarea
              className="border border-zinc-500 p-3 focus:ring-0 focus:outline-none"
              rows={3}
              placeholder="notes?"
              name="notes"
              defaultValue={clothing.notes ?? ""}
            />
          </Form>
          <Form method="post" className="flex flex-col gap-4">
            <Button
              type="submit"
              color="black"
              className="rounded-none"
              value="delete"
            >
              Delete
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ClosetItem;
