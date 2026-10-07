import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";

import authRoutes from "./modules/auth/auth.routes.js";

import invitationRoutes from "./modules/invitations/invitation.routes.js";

import adminInvitationRoutes from "./modules/invitations/adminInvitation.routes.js";

import adminUserRoutes from "./modules/adminUsers/adminUser.routes.js";

import { requestId } from "./middleware/requestId.js";

import { requestLogger } from "./middleware/requestLogger.js";

import { notFound } from "./middleware/notFound.js";

import { errorHandler } from "./middleware/errorHandler.js";

import clinicRoutes from "./modules/clinics/clinic.routes.js";

import adminClinicRoutes from "./modules/clinics/adminClinic.routes.js";

import catalogRoutes from "./modules/catalog/catalog.routes.js";

import adminCatalogRoutes from "./modules/catalog/adminCatalog.routes.js";

import labSlipRoutes from "./modules/labSlips/labSlip.routes.js";

import scanBookingRoutes from "./modules/scanBookings/scanBooking.routes.js";

import productionRoutes from "./modules/production/production.routes.js";

import correctionRoutes from "./modules/corrections/correction.routes.js";

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

app.use(cookieParser());

app.use("/api/v1/health", healthRoutes);

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/invitations", invitationRoutes);

app.use("/api/v1/admin/invitations", adminInvitationRoutes);

app.use("/api/v1/admin/users", adminUserRoutes);

app.use("/api/v1/clinics", clinicRoutes);

app.use("/api/v1/admin/clinics", adminClinicRoutes);

app.use("/api/v1/catalog", catalogRoutes);

app.use("/api/v1/admin/catalog", adminCatalogRoutes);

app.use("/api/v1/lab-slips", labSlipRoutes);

app.use("/api/v1/scan-bookings", scanBookingRoutes);

app.use("/api/v1/productions", productionRoutes);

app.use("/api/v1/corrections", correctionRoutes);

app.use(notFound);

app.use(errorHandler);
