/**
 * AWS S3 client configuration and presigned URL generation.
 *
 * Presigned PUT URLs are returned to the landlord client so it can upload
 * media directly to S3 — the server never handles raw file bytes.
 *
 * Upload flow:
 *   1. Landlord calls `listing.getUploadUrls` → server returns presigned PUT URLs
 *   2. Client PUTs each file directly to S3 using the presigned URL
 *   3. Client calls `listing.confirmMediaUploads` with the S3 keys
 *   4. Server inserts rows into the `media` table
 */

import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export type AllowedMediaType = "image/jpeg" | "image/png" | "image/webp" | "video/mp4";

const ALLOWED_MIME_TYPES: AllowedMediaType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
];

const MAX_FILE_SIZES: Record<AllowedMediaType, number> = {
  "image/jpeg": 10 * 1024 * 1024,   // 10 MB
  "image/png": 10 * 1024 * 1024,    // 10 MB
  "image/webp": 10 * 1024 * 1024,   // 10 MB
  "video/mp4": 100 * 1024 * 1024,   // 100 MB
};

/** Presigned URL expires after 15 minutes — sufficient for client upload */
const PRESIGNED_URL_TTL_SECONDS = 900;

export type PresignedUploadResult = {
  uploadUrl: string;   // PUT to this
  s3Key: string;       // Store this in DB after upload confirmation
  publicUrl: string;   // CloudFront / S3 public URL
  expiresAt: Date;
};

/**
 * Generate a presigned S3 PUT URL for a single media file.
 *
 * The S3 key structure: `listings/{listingId}/{uuid}.{ext}`
 * This keeps all listing media grouped under the listing ID prefix.
 */
export async function generatePresignedUploadUrl(params: {
  listingId: string;
  mimeType: string;
  fileSizeBytes: number;
}): Promise<PresignedUploadResult> {
  const { listingId, mimeType, fileSizeBytes } = params;

  // ── Validate mime type ────────────────────────────────────────────────────
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMediaType)) {
    throw new Error(
      `Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  const typedMime = mimeType as AllowedMediaType;
  const maxSize = MAX_FILE_SIZES[typedMime];

  if (fileSizeBytes > maxSize) {
    throw new Error(
      `File too large: ${fileSizeBytes} bytes. Max for ${mimeType}: ${maxSize} bytes`
    );
  }

  // ── Build S3 key ──────────────────────────────────────────────────────────
  const ext = mimeType.split("/")[1]!.replace("jpeg", "jpg");
  const fileId = crypto.randomUUID();
  const s3Key = `listings/${listingId}/${fileId}.${ext}`;
  const publicUrl = `${env.MEDIA_BASE_URL}/${s3Key}`;

  // ── Generate presigned URL ────────────────────────────────────────────────
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
    // Enforce server-side encryption at rest
    ServerSideEncryption: "AES256",
    // Tag for lifecycle policy management
    Tagging: `listingId=${listingId}&status=pending`,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: PRESIGNED_URL_TTL_SECONDS,
  });

  return {
    uploadUrl,
    s3Key,
    publicUrl,
    expiresAt: new Date(Date.now() + PRESIGNED_URL_TTL_SECONDS * 1000),
  };
}

/**
 * Delete a media object from S3 (e.g. when listing is deleted or media replaced).
 */
export async function deleteS3Object(s3Key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
    })
  );
}
