import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { useToast } from "./toasts";
import { Upload } from "lucide-react";

type UploadActionData =
  | { success: true; clothingId: string }
  | { success: false; error: string };

const hasFileDrop = (event: DragEvent) => {
  const types = event.dataTransfer?.types
    ? Array.from(event.dataTransfer.types)
    : [];
  return (
    types.includes("Files") || (event.dataTransfer?.files?.length ?? 0) > 0
  );
};

const pickImageFile = (files: FileList | null) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    Array.from(files).find((file) => file.type.startsWith("image/")) ??
    files.item(0)
  );
};

const ImageDragHandler = () => {
  const fetcher = useFetcher<UploadActionData>();
  const { info, error } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isSubmittingRef.current = fetcher.state === "submitting";
  }, [fetcher.state]);

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      if (!hasFileDrop(event)) {
        return;
      }
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!hasFileDrop(event)) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!hasFileDrop(event)) {
        return;
      }
      event.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = (event: DragEvent) => {
      if (!hasFileDrop(event)) {
        return;
      }
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);

      if (isSubmittingRef.current) {
        return;
      }

      const image = pickImageFile(event.dataTransfer?.files ?? null);
      if (!image) {
        error("Drop an image file to add it to your closet.");
        return;
      }

      const formData = new FormData();
      formData.append("image", image);
      fetcher.submit(formData, {
        method: "post",
        encType: "multipart/form-data",
      });
      info("Uploading item to your closet...");
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [error, fetcher, info]);

  return isDragging ? (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur">
      <div className="flex flex-row gap-2 rounded-xl border bg-white px-6 py-4 text-center shadow-lg">
        <Upload size={24} />
        <p className="text-lg font-semibold text-zinc-900">
          Drop to add this item to your closet
        </p>
      </div>
    </div>
  ) : null;
};

export default ImageDragHandler;
