import {
  completeProduction,
  getProduction,
  listProductions,
  moveProductionBack,
  startProduction,
} from "./production.service.js";

import {
  serializeProduction,
  serializeProductionSummary,
} from "./production.serializer.js";

export async function list(req, res, next) {
  try {
    const result = await listProductions({
      user: req.user,

      query: req.validatedQuery,
    });

    res.status(200).json({
      success: true,

      data: {
        productions: result.productions.map(serializeProductionSummary),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const production = await getProduction({
      user: req.user,
      productionId: req.params.productionId,
    });

    res.status(200).json({
      success: true,

      data: {
        production: serializeProduction(production),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function start(req, res, next) {
  try {
    const production = await startProduction({
      user: req.user,
      productionId: req.params.productionId,
      note: req.body.note,
    });

    res.json({
      success: true,

      data: {
        production: serializeProduction(production),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function complete(req, res, next) {
  try {
    const production = await completeProduction({
      user: req.user,
      productionId: req.params.productionId,
      note: req.body.note,
    });

    res.json({
      success: true,

      data: {
        production: serializeProduction(production),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function moveBack(req, res, next) {
  try {
    const production = await moveProductionBack({
      user: req.user,
      productionId: req.params.productionId,
      targetStatus: req.body.targetStatus,
      reason: req.body.reason,
    });

    res.json({
      success: true,

      data: {
        production: serializeProduction(production),
      },
    });
  } catch (error) {
    next(error);
  }
}
