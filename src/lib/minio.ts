import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

const globalForMinio = globalThis as unknown as { minioClient?: S3Client };

export const minioClient =
  globalForMinio.minioClient ??
  new S3Client({
    region: process.env.MINIO_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true, // REQUIRED for MinIO — without this, presigned URLs return 403
  });

if (process.env.NODE_ENV !== "production") globalForMinio.minioClient = minioClient;
