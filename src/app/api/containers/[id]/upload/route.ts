import { type NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { minioClient } from "@/lib/minio";
import { requireAdmin } from "@/lib/dal/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const filename = request.nextUrl.searchParams.get("filename");
  const contentType =
    request.nextUrl.searchParams.get("contentType") ?? "application/pdf";
  const documentType =
    request.nextUrl.searchParams.get("documentType") ?? "other";

  if (!filename) {
    return Response.json({ error: "filename is required" }, { status: 400 });
  }

  // Sanitize filename — strip special chars, keep extension
  const ext = filename.split(".").pop()?.toLowerCase() ?? "pdf";
  const randomStr = Math.random().toString(36).slice(2);
  const safeName = `${Date.now()}-${randomStr}.${ext}`;
  // Key scoped by container id to avoid namespace collisions (Pitfall 4)
  const key = `containers/${id}/${safeName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(minioClient, command, { expiresIn: 300 });
  const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/${key}`;

  return Response.json({
    presignedUrl,
    publicUrl,
    documentType,
    originalFilename: filename,
    storedFilename: safeName,
  });
}
