import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL não definida");
}

// ponytail: o Postgres auto-hospedado ainda não tem TLS (TODO(SSL_ENFORCEMENT)),
// então o gate de sslmode=require só vale em produção por enquanto. T080 resolve
// o host e então este `if` passa a valer para todo ambiente fora de teste (R17).
if (process.env.NODE_ENV === "production" && !url.includes("sslmode=require")) {
  throw new Error(
    "DATABASE_URL de produção precisa de sslmode=require (Princípio V, R17)",
  );
}

const client = postgres(url);
export const db = drizzle(client, { schema });
