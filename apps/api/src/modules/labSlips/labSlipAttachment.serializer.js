export function serializeLabSlipAttachment(
  attachment,
  { canDelete = false } = {},
) {
  return {
    id: attachment.id,

    originalFilename: attachment.originalFilename,

    contentType: attachment.contentType,

    sizeBytes: attachment.sizeBytes,

    uploadedByUserId: String(attachment.uploadedByUserId),

    canDelete,

    createdAt: attachment.createdAt,

    updatedAt: attachment.updatedAt,
  };
}
