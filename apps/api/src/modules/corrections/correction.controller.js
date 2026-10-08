import {
  createCorrection,
  getActiveCorrectionForLabSlip,
  getCorrection,
  listCorrections,
  rejectCorrection,
  requestCorrectionClarification,
  resolveCorrection,
  respondToCorrectionClarification,
  startCorrectionReview,
} from "./correction.service.js";

import {
  createCorrectionAttachment,
  deleteCorrectionAttachment,
  getCorrectionAttachmentAccess,
  listCorrectionAttachments,
} from "./correctionAttachment.service.js";

import {
  serializeCorrection,
  serializeCorrectionAttachment,
  serializeCorrectionSummary,
} from "./correction.serializer.js";

export async function list(req, res, next) {
  try {
    const result = await listCorrections({
      user: req.user,
      query: req.validatedQuery,
    });

    res.status(200).json({
      success: true,

      data: {
        corrections: result.corrections.map(serializeCorrectionSummary),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const correction = await getCorrection({
      user: req.user,
      correctionId: req.params.correctionId,
    });

    res.status(200).json({
      success: true,

      data: {
        correction: serializeCorrection(correction),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadAttachment(req, res, next) {
  try {
    const attachment = await createCorrectionAttachment({
      user: req.user,
      correctionId: req.params.correctionId,
      file: req.file,
    });

    res.status(201).json({
      success: true,

      data: {
        attachment: serializeCorrectionAttachment(attachment, {
          canDelete: true,
        }),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAttachments(req, res, next) {
  try {
    const result = await listCorrectionAttachments({
      user: req.user,
      correctionId: req.params.correctionId,
    });

    res.status(200).json({
      success: true,

      data: {
        attachments: result.attachments.map(({ attachment, canDelete }) =>
          serializeCorrectionAttachment(attachment, {
            canDelete,
          }),
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function accessAttachment(req, res, next) {
  try {
    const result = await getCorrectionAttachmentAccess({
      user: req.user,
      correctionId: req.params.correctionId,
      attachmentId: req.params.attachmentId,
    });

    res.status(200).json({
      success: true,

      data: {
        attachment: serializeCorrectionAttachment(result.attachment),

        url: result.url,

        expiresInSeconds: result.expiresInSeconds,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeAttachment(req, res, next) {
  try {
    await deleteCorrectionAttachment({
      user: req.user,
      correctionId: req.params.correctionId,
      attachmentId: req.params.attachmentId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const correction = await createCorrection({
      user: req.user,
      labSlipId: req.body.labSlipId,
      data: {
        description: req.body.description,
        affectedLabSlipItemIds: req.body.affectedLabSlipItemIds,
      },
    });

    res.status(201).json({
      success: true,

      data: {
        correction: serializeCorrection(correction),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function startReview(req, res, next) {
  try {
    const correction = await startCorrectionReview({
      user: req.user,
      correctionId: req.params.correctionId,
      note: req.body.note,
    });

    res.status(200).json({
      success: true,

      data: {
        correction: serializeCorrection(correction),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function requestClarification(req, res, next) {
  try {
    const correction = await requestCorrectionClarification({
      user: req.user,
      correctionId: req.params.correctionId,
      note: req.body.note,
    });

    res.status(200).json({
      success: true,

      data: {
        correction: serializeCorrection(correction),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function respondClarification(req, res, next) {
  try {
    const correction = await respondToCorrectionClarification({
      user: req.user,
      correctionId: req.params.correctionId,
      note: req.body.note,
    });

    res.status(200).json({
      success: true,

      data: {
        correction: serializeCorrection(correction),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resolve(req, res, next) {
  try {
    const correction = await resolveCorrection({
      user: req.user,
      correctionId: req.params.correctionId,
      outcome: req.body.outcome,
      note: req.body.note,
    });

    res.status(200).json({
      success: true,

      data: {
        correction: serializeCorrection(correction),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reject(req, res, next) {
  try {
    const correction = await rejectCorrection({
      user: req.user,
      correctionId: req.params.correctionId,
      note: req.body.note,
    });

    res.status(200).json({
      success: true,

      data: {
        correction: serializeCorrection(correction),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveForLabSlip(req, res, next) {
  try {
    const correction = await getActiveCorrectionForLabSlip({
      user: req.user,
      labSlipId: req.params.labSlipId,
    });

    res.status(200).json({
      success: true,
      data: {
        correction: correction ? serializeCorrectionSummary(correction) : null,
      },
    });
  } catch (error) {
    next(error);
  }
}
