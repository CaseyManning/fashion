import {
  Form,
  href,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/outfitgen";
import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { getUser } from "~/utils/global-context";
import { and, eq, inArray, type InferSelectModel } from "drizzle-orm";
import Button from "~/components/ui/button";
import { transformImage } from "~/imagen/gemini-image";
import { useEffect, useMemo, useState } from "react";
import { processAndSave, readImageBuffer } from "~/utils/images.server";

type Clothing = InferSelectModel<typeof schema.clothing>;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Outfit generator" }];
}

export async function loader() {
  const db = database();
  const user = getUser();

  const clothing = await db.query.clothing.findMany({
    where: eq(schema.clothing.userId, user.id),
  });

  const bodyPhotos = await db.query.bodyPhotos.findMany({
    where: eq(schema.bodyPhotos.userId, user.id),
  });

  const outfits = await db.query.outfitGenerations.findMany({
    where: eq(schema.outfitGenerations.userId, user.id),
    with: {
      outfitsToClothing: {
        with: {
          clothing: true,
        },
      },
    },
  });

  return { clothing, outfits, bodyPhotos };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const selected = formData
    .getAll("clothingIds")
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const promptInput = formData.get("prompt");
  const db = database();
  const user = getUser();

  if (selected.length === 0) {
    return { error: "Choose at least one clothing item to build an outfit." };
  }

  const clothing = await db.query.clothing.findMany({
    where: and(
      eq(schema.clothing.userId, user.id),
      inArray(schema.clothing.id, selected)
    ),
  });

  if (clothing.length !== selected.length) {
    return { error: "Some selected items could not be found for this user." };
  }

  const withPreviews = clothing.filter((item) => item.previewImg);
  if (!withPreviews.length) {
    return { error: "The selected items do not have preview images yet." };
  }
  if (withPreviews.length !== clothing.length) {
    return { error: "All selected items need completed preview images." };
  }

  const bodyPhotos = await db.query.bodyPhotos.findMany({
    where: eq(schema.bodyPhotos.userId, user.id),
  });

  if (bodyPhotos.length === 0) {
    return {
      error: "Add at least one body photo so we can place the outfit on you.",
    };
  }

  const buffers: Buffer[] = [];
  for (const item of withPreviews) {
    if (!item.previewImg) continue;
    try {
      const buffer = await readImageBuffer(item.previewImg);
      buffers.push(buffer);
    } catch (error) {
      console.error("Unable to read preview image", item.previewImg, error);
      return { error: "Could not read one of the preview images." };
    }
  }

  for (const photo of bodyPhotos) {
    if (!photo.key) continue;
    try {
      const buffer = await readImageBuffer(photo.key);
      buffers.push(buffer);
    } catch (error) {
      console.error("Unable to read body photo", photo.key, error);
      return { error: "Could not read one of the body photos." };
    }
  }

  const prompt =
    typeof promptInput === "string" && promptInput.trim().length > 0
      ? promptInput.trim()
      : ``;

  const generated = await transformImage(
    buffers,
    `${prompt}\nUse the person in the body reference photos as the model wearing the outfit. Keep skin tone, face, and body shape, consistent with the references while accurately rendering each selected clothing item.`
  );
  if (!generated) {
    return { error: "Gemini did not return an outfit image. Try again." };
  }

  const { relativePath } = await processAndSave(
    generated.previewImgBuffer,
    "outfits"
  );

  const [outfit] = await db
    .insert(schema.outfitGenerations)
    .values({
      userId: user.id,
      prompt,
      image: relativePath,
    })
    .returning();

  if (outfit) {
    await db.insert(schema.outfitsToClothing).values(
      selected.map((clothingId) => ({
        outfitId: outfit.id,
        clothingId,
      }))
    );
  }

  return { success: true, outfitId: outfit?.id ?? null };
}

function ClothingCard({
  item,
  checked,
  onToggle,
  disabled,
}: {
  item: Clothing;
  checked: boolean;
  onToggle: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <label
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border bg-white p-3 transition-[border,box-shadow,transform] ${
        checked ? "border-black shadow-sm" : "border-zinc-200"
      } ${disabled ? "opacity-60" : "hover:-translate-y-0.5"}`}
    >
      <input
        type="checkbox"
        name="clothingIds"
        value={item.id}
        className="sr-only"
        checked={checked}
        onChange={() => onToggle(item.id)}
        disabled={disabled}
      />
      {item.previewImg ? (
        <img
          src={item.previewImg}
          alt={item.name ?? item.category}
          className="h-28 w-full object-contain"
        />
      ) : (
        <div className="flex h-28 w-full items-center justify-center text-sm text-zinc-500">
          No preview yet
        </div>
      )}
      <div className="w-full text-left">
        <p className="text-sm font-medium text-black">
          {item.name || "Unnamed piece"}
        </p>
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {item.category}
        </p>
      </div>
      <div
        className={`absolute right-3 top-3 h-5 w-5 rounded-full border ${
          checked ? "border-black bg-black" : "border-zinc-300 bg-white"
        }`}
      />
      {item.processing ? (
        <span className="absolute left-3 top-3 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          processing
        </span>
      ) : null}
    </label>
  );
}

export default function OutfitGen() {
  const actionData = useActionData<typeof action>();
  const { clothing, outfits, bodyPhotos } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (actionData?.success) {
      setSelected([]);
    }
  }, [actionData?.success]);

  const readyClothing = useMemo(
    () => clothing.filter((item) => item.previewImg),
    [clothing]
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <p className="text-2xl font-semibold text-black">Outfit generator</p>
        <p className="text-sm text-zinc-600">
          Pick processed closet items and combine them with your saved body
          photos so Gemini can render the look on you.
        </p>
      </div>

      <Form method="post" className="space-y-4">
        <div className="flex items-center justify-between text-sm text-zinc-700">
          <span>
            Select from {readyClothing.length} ready items
            {selected.length ? ` (${selected.length} chosen)` : ""} · Using{" "}
            {bodyPhotos.length} body photo
            {bodyPhotos.length === 1 ? "" : "s"}
          </span>
          <Button
            type="submit"
            color="black"
            disabled={
              isSubmitting || selected.length === 0 || bodyPhotos.length === 0
            }
          >
            {isSubmitting
              ? "Generating..."
              : selected.length
                ? `Generate outfit (${selected.length})`
                : "Pick items to generate"}
          </Button>
        </div>

        {bodyPhotos.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Add at least one body photo in your profile so the generator can
            place outfits on you.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {readyClothing.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              checked={selected.includes(item.id)}
              onToggle={toggle}
              disabled={isSubmitting}
            />
          ))}
          {readyClothing.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
              Upload items to your closet and wait for previews to finish
              processing before generating outfits.
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="prompt">
            Prompt (optional)
          </label>
          <textarea
            id="prompt"
            name="prompt"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none ring-0 focus:border-zinc-400"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {actionData?.error ? (
          <p className="text-sm font-medium text-red-600">{actionData.error}</p>
        ) : actionData?.success ? (
          <p className="text-sm text-emerald-600">
            Outfit generated and saved.
          </p>
        ) : null}
      </Form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-black">Saved outfits</p>
          <p className="text-xs text-zinc-500">
            Linked clothing items are stored in <code>outfits_to_clothing</code>
            .
          </p>
        </div>
        {outfits.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {outfits.map((outfit) => (
              <Link
                key={outfit.id}
                to={href("/outfit/:id", { id: outfit.id })}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-black"
              >
                {outfit.image ? (
                  <div className="mb-3 overflow-hidden rounded-md bg-zinc-50">
                    <img
                      src={outfit.image}
                      alt="Generated outfit"
                      className="h-64 w-full object-contain"
                    />
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="text-sm text-zinc-800">
                    {outfit.prompt || "No prompt saved"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {outfit.outfitsToClothing.map((item) => (
                      <span
                        key={item.clothing.id}
                        className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700"
                      >
                        {item.clothing.name || item.clothing.category}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">
            No outfits yet. Pick a few closet items and generate one to get
            started.
          </p>
        )}
      </div>
    </div>
  );
}
