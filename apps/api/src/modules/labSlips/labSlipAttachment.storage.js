import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "../../config/env.js";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client = null;

function getR2Config() {
  const config = {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
  };

  const missing = Object.entries(config).find(([, value]) => !value);

  if (missing) {
    throw new Error(`R2 storage is not configured: missing ${missing[0]}`);
  }

  return config;
}

function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  const config = getR2Config();

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return r2Client;
}

export async function storeLabSlipAttachment({
  objectKey,
  buffer,
  contentType,
}) {
  const config = getR2Config();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: "inline",
      CacheControl: "private, no-store",
    }),
  );
}

export async function createLabSlipAttachmentAccessUrl(objectKey) {
  const config = getR2Config();

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    }),
    {
      expiresIn: 5 * 60,
    },
  );
}

export async function deleteLabSlipAttachmentObject(objectKey) {
  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    }),
  );
}
