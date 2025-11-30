import sharp, { type Sharp } from "sharp";
import path from "path";
import type { Clothing } from "~/routes/closet/closet";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import * as schema from "~/database/schema";
import {
  Model,
  structuredResponseFromImage,
  transformImage,
} from "~/imagen/gemini-image";
import z from "zod/v3";
import { eq } from "drizzle-orm";
import { cropToNonTransparent } from "./imageutils.server";

export async function processAndSave(
  buffer: Buffer,
  folder: string = "closet"
) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

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
): Promise<Pick<Clothing, "category" | "description">> {
  const infoSchema = z.object({
    category: z.enum(schema.clothingCategory.enumValues),
    description: z.string(),
  });
  const response = await structuredResponseFromImage(
    image,
    "Determine the category of the clothing item from the image and create a detailed description of the item for the purposes of accurately recreating its visual appearance.",
    infoSchema
  );
  return {
    category: response.category,
    description: response.description,
  };
}

async function processUploadedClothing(clothing: Clothing, img: Sharp) {
  const { category, description } = await extractInfoForClothing(
    await img.toBuffer()
  );

  console.log("extracting info finished");

  const { removeBackground } = await import("@imgly/background-removal-node");

  const { previewImgBuffer, generationData } = await transformImage(
    [await img.toBuffer()],
    "Generate a clean preview in the style of a brand / fashion photoshoot of the following clothing item, matching the details and colors and shape of the item as closely as possible. The item should be the only object in the image. Do not include a background, use plain white behind the item. No horizontal whitespace - edges of item should be nearly flush with the edges of the image. The proportions of the output should exactly match the input. Remove any extra objects such as hangers.",
    Model.Flash_2_5_Image
  );
  if (!previewImgBuffer) {
    throw new Error("Failed to generate preview image");
  }
  console.log("preview image generated");

  const blob = new Blob([previewImgBuffer as unknown as ArrayBuffer], {
    type: "image/png",
  });
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
      description,
      processing: false,
      previewGenerationData: generationData,
    })
    .where(eq(schema.clothing.id, clothing.id));

  console.log("processing finished");
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

  await db.insert(schema.uploadedClothingPhotos).values({
    userId: user.id,
    key: relativePath,
    clothingId: clothing.id,
  });

  processUploadedClothing(clothing, img).catch((error) => {
    console.error(error);
  });

  return clothing;
}
