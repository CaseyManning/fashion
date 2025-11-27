import { GoogleGenAI } from "@google/genai";

export enum Model {
  Flash_2_5 = "gemini-2.5-flash-image",
}

export async function generateImage(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: Model.Flash_2_5,
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
