import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client = null;

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getR2Config() {
  const accountId = getRequiredEnvironmentVariable("R2_ACCOUNT_ID");

  return {
    accountId,

    accessKeyId: getRequiredEnvironmentVariable("R2_ACCESS_KEY_ID"),

    secretAccessKey: getRequiredEnvironmentVariable("R2_SECRET_ACCESS_KEY"),

    bucketName: getRequiredEnvironmentVariable("R2_BUCKET_NAME"),
  };
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

export async function storeCorrectionAttachment({
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

export async function createCorrectionAttachmentAccessUrl(objectKey) {
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

export async function deleteCorrectionAttachmentObject(objectKey) {
  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    }),
  );
}
