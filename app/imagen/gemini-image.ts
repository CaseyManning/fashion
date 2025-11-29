import { GoogleGenAI } from "@google/genai";
import type z from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export enum Model {
  Flash_2_5_Image = "gemini-2.5-flash-image",
  Flash_2_5 = "gemini-2.5-flash",
}

export async function generateImage(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: Model.Flash_2_5_Image,
    contents: prompt,
  });

  // Walk through parts and save the first image
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    console.error("No candidates returned:", response);
    return;
  }

  for (const part of candidate.content.parts) {
    if (part.text) {
      // Sometimes the model also returns a textual explanation
      console.log("Text part:", part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data; // base64 string
      if (!imageData) {
        console.error("No image data returned:", part);
        return;
      }
      const buffer = Buffer.from(imageData, "base64");
      return buffer;
    }
  }
}

export async function transformImage(
  imageBuffer: Buffer,
  prompt: string,
  mimeType = "image/png"
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: Model.Flash_2_5_Image,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBuffer.toString("base64"),
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    console.error("No candidates returned:", response);
    return;
  }

  for (const part of candidate.content.parts) {
    if (part.text) {
      console.log("Text part:", part.text);
      continue;
    }
    if (part.inlineData?.data) {
      const base64 = part.inlineData.data;
      return Buffer.from(base64, "base64");
    }
  }
}

export async function structuredResponseFromImage<T>(
  imageBuffer: Buffer,
  prompt: string,
  schema: z.ZodSchema<T>,
  mimeType = "image/png"
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: Model.Flash_2_5,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBuffer.toString("base64"),
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(schema),
    },
  });
  if (!response.text) {
    throw new Error("No text returned from Gemini");
  }

  const match = schema.parse(JSON.parse(response.text));
  return match;
}

// Preserve the earlier typo just in case anything imports it.
export const transofrmImage = transformImage;
