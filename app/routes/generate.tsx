import { Form, useNavigation } from "react-router";
import Button from "~/components/ui/button";
import { generateImage, transformImage } from "~/imagen/gemini-image";
import type { Route } from "./+types/generate";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Generate an image" },
    { name: "description", content: "Create an image with Gemini" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const image = formData.get("image");

  if (typeof prompt !== "string" || !prompt.trim()) {
    return { error: "Please enter a prompt to generate an image." };
  }

  const promptText = prompt.trim();
  const hasImage =
    image instanceof File &&
    typeof image.arrayBuffer === "function" &&
    image.size > 0;

  try {
    if (hasImage) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = image.type || "image/png";
      const transformed = await transformImage([buffer], promptText);

      if (!transformed) {
        return {
          error: "Gemini did not return transformed image data. Try again.",
          prompt: promptText,
        };
      }

      const base64 = transformed.previewImgBuffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return { image: dataUrl, prompt: promptText, mode: "transform" as const };
    } else {
      const buffer = await generateImage(promptText);
      if (!buffer) {
        return {
          error: "Gemini did not return image data. Try again.",
          prompt: promptText,
        };
      }

      const base64 = buffer.toString("base64");
      const image = `data:image/png;base64,${base64}`;

      return { image, prompt: promptText, mode: "generate" as const };
    }
  } catch (error) {
    console.error("Gemini image generation failed", error);
    return {
      error: "Something went wrong while generating the image.",
      prompt: promptText,
    };
  }
}

export default function GenerateRoute({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <p className="text-2xl font-semibold text-black">Gemini image demo</p>
        <p className="text-sm text-zinc-600">
          Enter a prompt, submit, and the route action will call Gemini using
          the helper in <code>app/imagen/gemini-image.ts</code>.
        </p>
      </div>

      <Form method="post" encType="multipart/form-data" className="space-y-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-800">Prompt</span>
          <textarea
            name="prompt"
            required
            defaultValue={actionData?.prompt}
            className="min-h-28 w-full rounded-md bg-zinc-100 px-3 py-2 text-base text-zinc-900 outline-none transition-[box-shadow,color] focus:ring-2 focus:ring-zinc-300 disabled:opacity-60"
            placeholder="e.g. A fashion editorial photo of a model in a neon raincoat under city lights"
            disabled={isSubmitting}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-800">
            Optional source image (for transform)
          </span>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800"
            disabled={isSubmitting}
          />
          <span className="text-xs text-zinc-500">
            If you pick a file, Gemini will transform it using the prompt.
          </span>
        </label>
        {actionData?.error ? (
          <p className="text-sm text-red-500">{actionData.error}</p>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate image"}
        </Button>
      </Form>

      {actionData?.image ? (
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-700">
            Prompt: <span className="font-medium">{actionData.prompt}</span>
          </p>
          {actionData.mode === "transform" ? (
            <p className="text-xs text-emerald-700">
              Transformed the uploaded image with your prompt.
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              Generated from prompt only (no image uploaded).
            </p>
          )}
          <div className="relative w-full overflow-hidden rounded-md bg-zinc-50">
            <img
              src={actionData.image}
              alt={`Gemini generated: ${actionData.prompt}`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
