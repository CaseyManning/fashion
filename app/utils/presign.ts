import type { InferSelectModel } from "drizzle-orm";
import { presignGetUrlForKey } from "./images.server";
import * as schema from "~/database/schema";

export async function presignMaybeKey(key?: string | null) {
  return key ? presignGetUrlForKey(key) : key;
}

export async function presignPhotos<T extends { key?: string | null }>(
  photos?: T[] | null
) {
  if (!photos) return photos;

  return Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      key: await presignMaybeKey(photo.key),
    }))
  );
}

export async function presignClothing<
  T extends {
    previewImg?: string | null;
    uploadedPhotos?: Array<{ key?: string | null }>;
  },
>(item: T): Promise<T> {
  const uploadedPhotos = item.uploadedPhotos
    ? await presignPhotos(item.uploadedPhotos)
    : item.uploadedPhotos;

  return {
    ...item,
    previewImg: await presignMaybeKey(item.previewImg),
    ...(uploadedPhotos !== undefined ? { uploadedPhotos } : {}),
  };
}

export async function presignClothingList<
  T extends {
    previewImg?: string | null;
    uploadedPhotos?: Array<{ key?: string | null }>;
  },
>(items: T[]): Promise<T[]> {
  return Promise.all(items.map((item) => presignClothing(item)));
}

type OutfitLike = InferSelectModel<typeof schema.outfitGenerations> & {
  clothing: InferSelectModel<typeof schema.clothing>[];
};

export async function presignOutfit<T extends OutfitLike>(
  outfit: T
): Promise<T> {
  return {
    ...outfit,
    image: await presignMaybeKey(outfit.image),
    clothing: await presignClothingList(outfit.clothing),
  };
}

export async function presignOutfitList<T extends OutfitLike>(
  outfits: T[]
): Promise<T[]> {
  return Promise.all(outfits.map((outfit) => presignOutfit(outfit)));
}

export async function presignList<T>(
  items: T[],
  presigner: (item: T) => Promise<T>
): Promise<T[]> {
  return Promise.all(items.map((item) => presigner(item)));
}
