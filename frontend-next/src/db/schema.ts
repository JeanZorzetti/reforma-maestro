import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categoriaEnum = pgEnum("categoria", [
  "material",
  "mao_de_obra",
  "taxas",
  "mobilia",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "canceled",
  "past_due",
  "expired",
]);

// --- Auth.js (@auth/drizzle-adapter) ---------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  passwordHash: text("password_hash").notNull(),
  /** Sessões emitidas antes deste instante são recusadas no callback `jwt` (lib/auth.ts). */
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }).notNull().defaultNow(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// --- Domínio -----------------------------------------------------------------

export const obras = pgTable(
  "obras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    orcamentoTetoCents: integer("orcamento_teto_cents").notNull(),
    reservaPct: numeric("reserva_pct", { precision: 5, scale: 2 }).notNull(),
    arquivadaEm: timestamp("arquivada_em", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("obras_user_id_arquivada_em_idx").on(table.userId, table.arquivadaEm),
    check("orcamento_teto_cents_positivo", sql`${table.orcamentoTetoCents} > 0`),
    check(
      "reserva_pct_entre_0_e_100",
      sql`${table.reservaPct} >= 0 AND ${table.reservaPct} <= 100`,
    ),
  ],
);

export const lancamentos = pgTable(
  "lancamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    obraId: uuid("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    data: date("data").notNull(),
    categoria: categoriaEnum("categoria").notNull(),
    item: text("item").notNull(),
    fornecedor: text("fornecedor"),
    previstoCents: integer("previsto_cents").notNull(),
    pagoCents: integer("pago_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("lancamentos_obra_id_data_idx").on(table.obraId, table.data.desc()),
    index("lancamentos_obra_id_categoria_idx").on(table.obraId, table.categoria),
    check("previsto_cents_nao_negativo", sql`${table.previstoCents} >= 0`),
    check("pago_cents_nao_negativo", sql`${table.pagoCents} >= 0`),
  ],
);

// --- Assinatura ---------------------------------------------------------------

export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull(),
  accessUntil: timestamp("access_until", { withTimezone: true }).notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  lastEventAt: timestamp("last_event_at", { withTimezone: true }),
  trialWarnedAt: timestamp("trial_warned_at", { withTimezone: true }),
  suspensaoAvisadaEm: timestamp("suspensao_avisada_em", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trialGrants = pgTable("trial_grants", {
  emailHash: text("email_hash").primaryKey(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  eventCreated: timestamp("event_created", { withTimezone: true }).notNull(),
  applied: boolean("applied").notNull(),
  unmatched: boolean("unmatched").notNull().default(false),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    event: text("event").notNull(),
    detail: jsonb("detail").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
  ],
);
