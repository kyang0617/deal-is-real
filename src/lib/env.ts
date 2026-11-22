import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  FETCH_USER_AGENT: z
    .string()
    .default("DealIsRealBot/0.1 (+https://github.com/kyang0617/deal-is-real)"),
  PRICE_PROVIDERS: z.string().default("mock"),
  KEEPA_API_KEY: z.string().optional(),
  SHOPSAVVY_API_KEY: z.string().optional(),
  BESTBUY_API_KEY: z.string().optional(),
  AMAZON_CREATORS_CREDENTIAL_ID: z.string().optional(),
  AMAZON_CREATORS_CREDENTIAL_SECRET: z.string().optional(),
  AMAZON_CREATORS_PARTNER_TAG: z.string().optional(),
  EMAIL_FROM: z.string().default("Deal Is Real <alerts@localhost>"),
  SMTP_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/** Validated server-side environment. Throws a readable error on misconfiguration. */
export function env(): Env {
  if (!cached) {
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
    }
    cached = parsed.data;
  }
  return cached;
}
