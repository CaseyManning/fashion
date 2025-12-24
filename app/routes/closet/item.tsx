import { eq, inArray } from "drizzle-orm";
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
  useSubmit,
} from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import { ArrowLeft, ArrowRight, Ellipsis, Plus, Trash, X } from "lucide-react";
import type { loader as closetLoader } from "./closet";
import {
  addClothingPhoto,
  reExtractInfoForClothing,
} from "~/clothing/clothing.server";
import { LightboxCard } from "~/components/ligthbox-card";
import { presignClothing } from "~/utils/presign";
import ExpandableTextarea from "~/components/ui/ExpandableTextarea";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Error("No id provided");
  }
  const db = database();
  const p_clothing = db.query.clothing.findFirst({
    where: eq(schema.clothing.id, id),
    with: {
      uploadedPhotos: true,
    },
  });
  const outfitLinks = await db.query.outfitsToClothing.findMany({
    where: eq(schema.outfitsToClothing.clothingId, id),
    with: {
      outfit: true,
    },
  });

  const outfits = outfitLinks.map((x) => x.outfit);

  const [clothing] = await Promise.all([p_clothing]);
  if (!clothing) {
    throw new Error("item not found");
  }

  return {
    clothing: await presignClothing(clothing),
    outfits: outfits,
  };
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
  } else if (action === "re-extract-info") {
    await reExtractInfoForClothing(id);
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

  const { clothesList } = useRouteLoaderData<typeof closetLoader>(
    "routes/closet/closet"
  )!;

  const navigate = useNavigate();

  const navigateLeft = useCallback(() => {
    const index = clothesList.findIndex((item) => item.id === clothing.id);
    navigate(
      href("/closet/:id", {
        id: (index > 0
          ? clothesList[index - 1]
          : clothesList[clothesList.length - 1]
        ).id,
      }),
      { replace: true }
    );
  }, [clothing.id, clothesList]);

  const navigateRight = useCallback(() => {
    const index = clothesList.findIndex((item) => item.id === clothing.id);
    navigate(
      href("/closet/:id", {
        id: (index < clothesList.length - 1
          ? clothesList[index + 1]
          : clothesList[0]
        ).id,
      }),
      { replace: true }
    );
  }, [clothing.id, clothesList]);

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

  const submit = useSubmit();

  const handleDelete = useCallback(() => {
    submit({ _action: "delete" }, { method: "post" });
  }, [clothing.id]);

  const handleReExtractInfo = useCallback(() => {
    submit({ _action: "re-extract-info" }, { method: "post" });
  }, [clothing.uploadedPhotos[0].key]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  return (
    <LightboxCard key={clothing.id} closeOnEscape={true}>
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
              className="w-auto object-contain drop-shadow-2xl/20 h-full p-5 lg:p-15 mx-auto"
            />
          )}
        </div>
        {clothing.previewGenerationData ? (
          <p className="text-xs text-zinc-500 w-full text-center">
            {clothing.previewGenerationData.model}
          </p>
        ) : null}
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
          <div className="relative">
            <Button color="transparent" onClick={toggleDropdown}>
              <Ellipsis size={20} />
            </Button>
            {isDropdownOpen && (
              <div className="absolute top-full right-0 bg-white shadow-lg/5 rounded-md p-1 border border-zinc-200">
                <Button
                  color="transparent"
                  onClick={handleDelete}
                  className="text-nowrap flex flex-row gap-2 items-center px-3!"
                >
                  <Trash size={20} />
                  Delete item
                </Button>
              </div>
            )}
          </div>
          <Button color="transparent" onClick={navigateLeft}>
            <ArrowLeft size={20} />
          </Button>
          <Button color="transparent" onClick={navigateRight}>
            <ArrowRight size={20} />
          </Button>
          <Button color="transparent" onClick={() => navigate(-1)}>
            <X size={20} />
          </Button>
        </div>
        <p className="font-semibold">Details</p>
        <Form
          method="post"
          className="flex flex-col gap-4"
          ref={formRef}
          onChange={onChange}
          key={clothing.id}
        >
          <div className="flex flex-row gap-4 w-full">
            <Input
              inputStyle="outline"
              type="text"
              placeholder="give it a name"
              name="name"
              defaultValue={clothing.name ?? ""}
              className="w-full"
            />
          </div>
          <div className="flex flex-row gap-4">
            <select
              name="category"
              defaultValue={clothing.category ?? ""}
              className="border border-zinc-500 p-3 focus:ring-0 focus:outline-none w-1/2"
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
              placeholder="brand?"
              name="brand"
              defaultValue={clothing.brand ?? ""}
              className="w-1/2"
            />
          </div>
          <ExpandableTextarea
            className="border border-zinc-500 p-3 focus:ring-0 focus:outline-none resize-none"
            placeholder="notes?"
            name="notes"
            defaultValue={clothing.notes ?? ""}
          />
        </Form>
        <p className="font-semibold">Wear it with</p>
      </div>
      <div className="absolute bottom-4 right-4 flex flex-row gap-2 max-w-[300px] hidden">
        {clothing.description ? (
          <p className="text-sm">{clothing.description}</p>
        ) : null}
        <Button color="transparent" onClick={handleReExtractInfo}>
          re-extract info
        </Button>
      </div>
    </LightboxCard>
  );
};

export default ClosetItem;
