import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ path: ".env.local" });
import postgres from "postgres";
import { afterEach } from "vitest";

const testUrl = process.env.DATABASE_URL_TEST;
const prodUrl = process.env.DATABASE_URL;

if (!testUrl) {
  throw new Error("DATABASE_URL_TEST não definida — configure frontend-next/.env.local");
}
if (testUrl === prodUrl) {
  throw new Error("DATABASE_URL_TEST não pode ser igual a DATABASE_URL");
}

execSync("npx drizzle-kit migrate", {
  env: { ...process.env, DATABASE_URL: testUrl },
  stdio: "inherit",
});

// Redireciona `@/db` (que lê DATABASE_URL) para o banco de teste dentro deste
// processo — nunca escreve de volta no .env.local, só no ambiente do runner.
process.env.DATABASE_URL = testUrl;

const sql = postgres(testUrl, { max: 1 });

export async function truncateAll() {
  await sql`
    truncate table
      audit_log, stripe_events, trial_grants, subscriptions,
      lancamentos, obras, sessions, accounts, verification_tokens, users
    restart identity cascade
  `;
}

afterEach(async () => {
  await truncateAll();
});
