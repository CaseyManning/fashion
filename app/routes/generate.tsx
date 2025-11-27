import { Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { generateImage } from "~/imagen/gemini-image";
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

  if (typeof prompt !== "string" || !prompt.trim()) {
    return { error: "Please enter a prompt to generate an image." };
  }

  const promptText = prompt.trim();

  try {
    const buffer = await generateImage(promptText);
    if (!buffer) {
      return {
        error: "Gemini did not return image data. Try again.",
        prompt: promptText,
      };
    }

    const base64 = buffer.toString("base64");
    const image = `data:image/png;base64,${base64}`;

    return { image, prompt: promptText };
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

      <Form method="post" className="space-y-4">
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
