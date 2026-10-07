import {
  createLabSlip,
  getLabSlip,
  listLabSlips,
  updateLabSlip,
} from "./labSlip.service.js";

import { serializeLabSlip } from "./labSlip.serializer.js";

import {
  createLabSlipAttachment,
  deleteLabSlipAttachment,
  getLabSlipAttachmentAccess,
  listLabSlipAttachments,
} from "./labSlipAttachment.service.js";

import { serializeLabSlipAttachment } from "./labSlipAttachment.serializer.js";

export async function create(req, res, next) {
  try {
    const labSlip = await createLabSlip({
      user: req.user,

      data: req.body,
    });

    res.status(201).json({
      success: true,

      data: {
        labSlip: serializeLabSlip(labSlip),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const result = await listLabSlips({
      user: req.user,

      query: req.validatedQuery,
    });

    res.status(200).json({
      success: true,

      data: {
        labSlips: result.labSlips.map(serializeLabSlip),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const labSlip = await getLabSlip({
      user: req.user,

      labSlipId: req.params.labSlipId,
    });

    res.status(200).json({
      success: true,

      data: {
        labSlip: serializeLabSlip(labSlip),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const labSlip = await updateLabSlip({
      user: req.user,

      labSlipId: req.params.labSlipId,

      data: req.body,
    });

    res.status(200).json({
      success: true,

      data: {
        labSlip: serializeLabSlip(labSlip),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadAttachment(req, res, next) {
  try {
    const attachment = await createLabSlipAttachment({
      user: req.user,

      labSlipId: req.params.labSlipId,

      file: req.file,
    });

    res.status(201).json({
      success: true,

      data: {
        attachment: serializeLabSlipAttachment(attachment),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAttachments(req, res, next) {
  try {
    const result = await listLabSlipAttachments({
      user: req.user,
      labSlipId: req.params.labSlipId,
    });

    res.status(200).json({
      success: true,

      data: {
        attachments: result.attachments.map(({ attachment, canDelete }) =>
          serializeLabSlipAttachment(attachment, {
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
    const result = await getLabSlipAttachmentAccess({
      user: req.user,
      labSlipId: req.params.labSlipId,
      attachmentId: req.params.attachmentId,
    });

    res.status(200).json({
      success: true,

      data: {
        attachment: serializeLabSlipAttachment(result.attachment),

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
    await deleteLabSlipAttachment({
      user: req.user,
      labSlipId: req.params.labSlipId,
      attachmentId: req.params.attachmentId,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
