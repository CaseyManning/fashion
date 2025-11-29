import sharp, { type Sharp } from "sharp";
import path from "path";
import type { Clothing } from "~/routes/closet/closet";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import * as schema from "~/database/schema";
import {
  structuredResponseFromImage,
  transformImage,
} from "~/imagen/gemini-image";
import z from "zod/v3";
import { eq } from "drizzle-orm";
import { cropToNonTransparent } from "./imageutils.server";

export async function processAndSave(buffer: Buffer) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "closet");

  const fileName = `${Date.now()}.png`;
  const filePath = path.join(uploadDir, fileName);

  const img = await sharp(buffer).rotate().toFormat("png");
  await img.toFile(filePath);

  const relativePath = "/" + path.relative(process.cwd() + "/public", filePath);

  return {
    relativePath,
    img,
  };
}

export async function addClothingPhoto(image: File, clothingId: string) {
  const buffer = Buffer.from(await image.arrayBuffer());
  const { relativePath } = await processAndSave(buffer);
  const db = database();
  const [uploadedPhoto] = await db
    .insert(schema.uploadedClothingPhotos)
    .values({
      userId: getUser().id,
      key: relativePath,
      clothingId,
    })
    .returning();
  console.log("photo added", uploadedPhoto);
}

export async function extractInfoForClothing(
  image: Buffer
): Promise<Pick<Clothing, "category">> {
  const infoSchema = z.object({
    category: z.enum(schema.clothingCategory.enumValues),
  });
  const response = await structuredResponseFromImage(
    image,
    "Determine the category of the clothing item from the image.",
    infoSchema
  );
  return {
    category: response.category,
  };
}

async function processUploadedClothing(clothing: Clothing, img: Sharp) {
  const { category } = await extractInfoForClothing(await img.toBuffer());

  console.log("extracting info finished");

  const { removeBackground } = await import("@imgly/background-removal-node");

  const previewImgBuffer = await transformImage(
    await img.toBuffer(),
    "Generate a clean, aesthetic-looking preview in the style of a brand / fashion photoshoot of the following clothing item, matching the details and colors of the item as closely as possible. The item should be centerd in the frame, lit softly, and be the only object in the image. Do not include a background, use plain white behind the item. No horizontal whitespace - edges of item should be nearly flush with the edges of the image."
  );
  if (!previewImgBuffer) {
    throw new Error("Failed to generate preview image");
  }
  console.log("preview image generated");

  const blob = new Blob([previewImgBuffer], { type: "image/png" });
  const noBg = await removeBackground(blob);
  const cropped = await cropToNonTransparent(
    Buffer.from(await noBg.arrayBuffer())
  );

  console.log("removing background finished");

  const db = database();

  const { relativePath: previewRelativePath } = await processAndSave(cropped);

  await db
    .update(schema.clothing)
    .set({
      previewImg: previewRelativePath,
      category,
      processing: false,
    })
    .where(eq(schema.clothing.id, clothing.id));
}

export async function uploadClothing(image: File): Promise<Clothing> {
  const buffer = Buffer.from(await image.arrayBuffer());

  console.log("uploading clothing");

  const db = database();
  const user = getUser();

  const { relativePath, img } = await processAndSave(buffer);

  const [clothing] = await db
    .insert(schema.clothing)
    .values({
      userId: user.id,
    })
    .returning();

  const uploadedPhoto = await db
    .insert(schema.uploadedClothingPhotos)
    .values({
      userId: user.id,
      key: relativePath,
      clothingId: clothing.id,
    })
    .returning();

  processUploadedClothing(clothing, img).catch((error) => {
    console.error(error);
  });

  console.log("processing finished");

  return clothing;
}
