import sharp, { type Sharp } from "sharp";
import path from "path";
import fs from "node:fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const isProduction = process.env.NODE_ENV === "production";
const bucketName = process.env.AWS_S3_BUCKET_NAME;

const s3Client = isProduction
  ? new S3Client({
      region: process.env.AWS_DEFAULT_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
      forcePathStyle: true,
    })
  : null;

function ensureS3Config() {
  if (!s3Client || !bucketName) {
    throw new Error("S3 is not configured correctly for production uploads.");
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function buildObjectKey(folder: string, fileName: string) {
  return path.posix.join("uploads", folder, fileName);
}

function normalizeKey(keyOrUrl: string) {
  if (isHttpUrl(keyOrUrl)) {
    const url = new URL(keyOrUrl);
    return url.pathname.replace(/^\/+/, "");
  }
  return keyOrUrl.replace(/^\/+/, "");
}

function publicUrlForKey(key: string) {
  if (!isProduction) {
    return "/" + key;
  }
  ensureS3Config();
  const targetBucket = bucketName!;
  const endpoint = process.env.AWS_ENDPOINT_URL;
  if (!endpoint) {
    throw new Error("Missing AWS_ENDPOINT_URL for production uploads.");
  }
  const endpointUrl = new URL(endpoint);
  const base = endpointUrl.toString().replace(/\/$/, "");
  const hasBucketInHost = endpointUrl.hostname.startsWith(`${targetBucket}.`);
  const hasBucketInPath = endpointUrl.pathname
    .replace(/^\/+/, "")
    .startsWith(targetBucket);

  const prefix =
    hasBucketInHost || hasBucketInPath ? base : `${base}/${targetBucket}`;
  return `${prefix}/${key}`;
}

async function saveToLocalFilesystem(key: string, pngBuffer: Uint8Array) {
  const filePath = path.join(process.cwd(), "public", key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, pngBuffer);
  return "/" + key;
}

async function saveToS3(key: string, pngBuffer: Uint8Array) {
  ensureS3Config();
  await s3Client!.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: pngBuffer,
      ContentType: "image/png",
      ACL: "public-read",
    })
  );
  return publicUrlForKey(key);
}

export async function readImageBuffer(pathOrUrl: string): Promise<Buffer> {
  const normalized = normalizeKey(pathOrUrl);

  if (isProduction && !isHttpUrl(pathOrUrl)) {
    const url = publicUrlForKey(normalized);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to fetch image from storage: ${url}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  if (isHttpUrl(pathOrUrl)) {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(`Unable to fetch image from URL: ${pathOrUrl}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  const imagePath = path.join(process.cwd(), "public", normalized);
  return fs.readFile(imagePath);
}

export async function processAndSave(
  buffer: Buffer,
  folder: string = "closet"
): Promise<{ relativePath: string; img: Sharp }> {
  const fileName = `${Date.now()}.png`;
  const objectKey = buildObjectKey(folder, fileName);

  const baseImage = sharp(buffer).rotate().toFormat("png");
  const pngBuffer = await baseImage.toBuffer();
  const pngArray = new Uint8Array(pngBuffer);
  const img = sharp(pngBuffer);

  const relativePath = isProduction
    ? await saveToS3(objectKey, pngArray)
    : await saveToLocalFilesystem(objectKey, pngArray);

  return {
    relativePath,
    img,
  };
}
