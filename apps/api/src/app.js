import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";

import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.disable("x-powered-by");

app.use(requestId);

app.use(requestLogger);

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use("/api/v1/health", healthRoutes);

app.use(notFound);

app.use(errorHandler);
