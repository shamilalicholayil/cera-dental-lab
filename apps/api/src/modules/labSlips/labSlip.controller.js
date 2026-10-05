import {
  createLabSlip,
  getLabSlip,
  listLabSlips,
  updateLabSlip,
} from "./labSlip.service.js";

import { serializeLabSlip } from "./labSlip.serializer.js";

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
