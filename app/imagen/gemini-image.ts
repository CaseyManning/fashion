import { GoogleGenAI } from "@google/genai";

export async function generateImage(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // This is the official JS pattern from the image-generation docs
  // model name = Nano Banana (Gemini 2.5 Flash Image)
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
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
