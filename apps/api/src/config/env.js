import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().positive().default(4000),

    CLIENT_URL: z.string().url(),

    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),

    REFRESH_TOKEN_SECRET: z
      .string()
      .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),

    INVITATION_TOKEN_SECRET: z
      .string()
      .min(32, "INVITATION_TOKEN_SECRET must be at least 32 characters"),

    JWT_ISSUER: z.string().min(1).default("cera-api"),

    JWT_AUDIENCE: z.string().min(1).default("cera-web"),

    INVITATION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(72),

    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.INVITATION_TOKEN_SECRET === value.REFRESH_TOKEN_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["INVITATION_TOKEN_SECRET"],
        message:
          "INVITATION_TOKEN_SECRET must be different from REFRESH_TOKEN_SECRET",
      });
    }

    const r2Variables = [
      ["R2_ACCOUNT_ID", value.R2_ACCOUNT_ID],
      ["R2_ACCESS_KEY_ID", value.R2_ACCESS_KEY_ID],
      ["R2_SECRET_ACCESS_KEY", value.R2_SECRET_ACCESS_KEY],
      ["R2_BUCKET_NAME", value.R2_BUCKET_NAME],
    ];

    const configuredR2Count = r2Variables.filter(([, value]) =>
      Boolean(value),
    ).length;

    /*
     * Production must have working private attachment storage.
     *
     * Development/test may omit R2 completely, but a partial
     * configuration is treated as an error.
     */
    const r2Required = value.NODE_ENV === "production" || configuredR2Count > 0;

    if (r2Required) {
      for (const [name, configuredValue] of r2Variables) {
        if (!configuredValue) {
          ctx.addIssue({
            code: "custom",
            path: [name],
            message: `${name} is required when R2 storage is configured`,
          });
        }
      }
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = result.data;
