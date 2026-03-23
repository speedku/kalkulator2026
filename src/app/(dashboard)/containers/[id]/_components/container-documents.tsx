"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addContainerDocumentAction } from "@/lib/actions/containers";
import type { ContainerWithItems, ContainerDocumentType } from "@/types/containers";

interface Props {
  container: ContainerWithItems;
}

const DOCUMENT_TYPE_LABELS: Record<ContainerDocumentType, string> = {
  invoice: "Faktura",
  bol: "Bill of Lading",
  certificate: "Certyfikat",
  photo: "Zdjęcie",
  customs: "Cło / Odprawa",
};

const DOCUMENT_TYPES: ContainerDocumentType[] = [
  "invoice",
  "bol",
  "certificate",
  "photo",
  "customs",
];

type UploadStatus = "idle" | "uploading" | "done" | "error";

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));

const fmtFileSize = (bytes: number | null) => {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ContainerDocuments({ container }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<ContainerDocumentType>("invoice");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("uploading");

    try {
      // Step 1: Get presigned PUT URL
      const params = new URLSearchParams({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        documentType: docType,
      });

      const resp = await fetch(
        `/api/containers/${container.id}/upload?${params.toString()}`
      );

      if (!resp.ok) {
        throw new Error("Błąd pobierania URL do uploadu");
      }

      const { presignedUrl, publicUrl, originalFilename, storedFilename } =
        await resp.json();

      // Step 2: PUT file directly to MinIO
      const putResp = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!putResp.ok) {
        throw new Error("Błąd uploadu pliku do MinIO");
      }

      // Step 3: Save document record via Server Action
      startTransition(async () => {
        const result = await addContainerDocumentAction(container.id, {
          documentType: docType,
          originalFilename: originalFilename ?? file.name,
          storedFilename: storedFilename ?? file.name,
          filePath: publicUrl,
          fileSize: file.size,
          mimeType: file.type || null,
        });

        if (result.error) {
          toast.error(result.error);
          setUploadStatus("error");
        } else {
          toast.success(result.success ?? "Dokument dodany");
          setUploadStatus("done");
          router.refresh();
          // Reset input
          if (fileRef.current) fileRef.current.value = "";
          setTimeout(() => setUploadStatus("idle"), 2000);
        }
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd uploadu");
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
  };

  const inputClass =
    "px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-aether-blue/50 focus:outline-none";

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
        Dokumenty ({container.documents.length})
      </h3>

      {/* Upload area */}
      <div className="mb-4 p-4 rounded-lg border border-dashed border-white/20 bg-white/5 space-y-3">
        <p className="text-xs text-gray-400 font-medium">Dodaj dokument</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Typ dokumentu</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as ContainerDocumentType)}
              className={inputClass}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOCUMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Plik</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleUpload}
              disabled={uploadStatus === "uploading"}
              className="block text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-aether-blue/20 file:text-aether-blue file:text-xs file:font-medium hover:file:bg-aether-blue/30 file:transition-colors disabled:opacity-50"
            />
          </div>
          {uploadStatus === "uploading" && (
            <span className="text-xs text-aether-blue animate-pulse">Wysyłanie...</span>
          )}
          {uploadStatus === "done" && (
            <span className="text-xs text-green-400">Dodano!</span>
          )}
          {uploadStatus === "error" && (
            <span className="text-xs text-red-400">Błąd uploadu</span>
          )}
        </div>
      </div>

      {/* Document list */}
      {container.documents.length === 0 ? (
        <div className="py-6 text-center text-gray-500 text-sm border border-dashed border-white/10 rounded-lg">
          Brak dokumentów. Dodaj pierwszy dokument powyżej.
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-white/10">
          <div className="divide-y divide-white/5">
            {container.documents.map((doc) => (
              <div
                key={doc.id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                      {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                    </span>
                    <p className="text-sm text-white/90 truncate">
                      {doc.originalFilename}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{fmtDate(doc.uploadedAt)}</span>
                    {doc.fileSize && <span>{fmtFileSize(doc.fileSize)}</span>}
                    {doc.mimeType && <span className="font-mono">{doc.mimeType}</span>}
                  </div>
                </div>
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-aether-blue/70 hover:text-aether-blue transition-colors"
                >
                  Pobierz →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
