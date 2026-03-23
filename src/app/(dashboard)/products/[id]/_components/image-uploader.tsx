"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { GlowButton } from "@/components/aether/glow-button";
import { updateProductImageAction } from "@/lib/actions/products";

interface ImageUploaderProps {
  productId: number;
  currentImageUrl: string | null;
}

export function ImageUploader({ productId, currentImageUrl }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: only images, max 5MB
    if (!file.type.startsWith("image/")) {
      toast.error("Dozwolone są tylko pliki graficzne");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maksymalny rozmiar pliku to 5MB");
      return;
    }

    setUploading(true);
    try {
      // Step 1: Get presigned URL from our Route Handler
      const res = await fetch(
        `/api/products/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
      );
      if (!res.ok) throw new Error("Nie można uzyskać URL do przesłania");
      const { presignedUrl, publicUrl } = await res.json() as { presignedUrl: string; publicUrl: string };

      // Step 2: PUT file directly to MinIO (bypasses Next.js server)
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Błąd podczas przesyłania do MinIO");

      // Step 3: Save publicUrl to product record
      const result = await updateProductImageAction(productId, publicUrl);
      if (result.error) throw new Error(result.error);

      setPreview(publicUrl);
      toast.success("Zdjęcie zostało zaktualizowane");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd podczas przesyłania zdjęcia");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {preview && (
        <div className="relative w-40 h-40 rounded-lg overflow-hidden glass">
          <Image src={preview} alt="Zdjęcie produktu" fill className="object-contain" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <GlowButton
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Przesyłanie..." : preview ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
      </GlowButton>
    </div>
  );
}
