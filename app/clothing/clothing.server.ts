import sharp from "sharp";
import path from "path";
import type { Clothing } from "~/routes/closet/closet";
import { database } from "~/database/context";
import { getUser } from "~/utils/global-context";
import * as schema from "~/database/schema";
import { transformImage } from "~/imagen/gemini-image";

async function processAndSave(buffer: Buffer) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "closet");

  const fileName = `${Date.now()}.png`;
  const filePath = path.join(uploadDir, fileName);

  const img = await sharp(buffer).rotate().toFormat("png");
  await img.toFile(filePath);

  const relativePath = path.relative(process.cwd() + "/public", filePath);

  return {
    relativePath,
    img,
  };
}

export async function uploadClothing(image: File): Promise<Clothing> {
  const buffer = Buffer.from(await image.arrayBuffer());

  const db = database();
  const user = getUser();

  const { removeBackground } = await import("@imgly/background-removal-node");
  const { relativePath, img } = await processAndSave(buffer);

  const previewImgBuffer = await transformImage(
    await img.toBuffer(),
    "Generate a clean, aesthetic-looking preview in the style of a brand / fashion photoshoot of the following clothing item, matching the details and colors of the item as closely as possible. The item should be centerd in the frame, lit softly, and be the only object in the image. Do not include a background, use plain white behind the item."
  );
  if (!previewImgBuffer) {
    throw new Error("Failed to generate preview image");
  }

  const blob = new Blob([previewImgBuffer], { type: "image/png" });
  const noBg = await removeBackground(blob);

  const { relativePath: previewRelativePath } = await processAndSave(
    Buffer.from(await noBg.arrayBuffer())
  );

  const clothing = await db
    .insert(schema.clothing)
    .values({
      userId: user.id,
      originalUploadImg: "/" + relativePath,
      previewImg: "/" + previewRelativePath,
    })
    .returning();

  return clothing[0];
}
