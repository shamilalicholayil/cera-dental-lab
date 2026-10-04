import { Router } from "express";

import { getDatabaseStatus } from "../config/database.js";

const router = Router();

router.get("/", (req, res) => {
  const database = getDatabaseStatus();

  const healthy = database.ready;

  res.status(healthy ? 200 : 503).json({
    success: healthy,

    data: {
      status: healthy ? "ok" : "degraded",

      service: "cera-api",

      database,
    },
  });
});

export default router;
