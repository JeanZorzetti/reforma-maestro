CREATE TYPE "public"."incident_kind" AS ENUM('server_error', 'webhook_failed', 'cron_failed', 'cron_missing');--> statement-breakpoint
CREATE TYPE "public"."periodicidade" AS ENUM('mensal', 'quinzenal', 'semanal');--> statement-breakpoint
CREATE TABLE "auth_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heartbeats" (
	"name" text PRIMARY KEY NOT NULL,
	"last_run_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"fingerprint" text PRIMARY KEY NOT NULL,
	"kind" "incident_kind" NOT NULL,
	"route" text NOT NULL,
	"message" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parcelamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obra_id" uuid NOT NULL,
	"total_cents" integer NOT NULL,
	"parcelas" integer NOT NULL,
	"periodicidade" "periodicidade" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "total_cents_positivo" CHECK ("parcelamentos"."total_cents" > 0),
	CONSTRAINT "parcelas_entre_2_e_60" CHECK ("parcelamentos"."parcelas" BETWEEN 2 AND 60)
);
--> statement-breakpoint
ALTER TABLE "lancamentos" ADD COLUMN "parcelamento_id" uuid;--> statement-breakpoint
ALTER TABLE "lancamentos" ADD COLUMN "parcela_num" integer;--> statement-breakpoint
ALTER TABLE "obras" ADD COLUMN "exemplo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "parcelamentos" ADD CONSTRAINT "parcelamentos_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incidents_notified_at_idx" ON "incidents" USING btree ("notified_at","last_seen_at");--> statement-breakpoint
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_parcelamento_id_parcelamentos_id_fk" FOREIGN KEY ("parcelamento_id") REFERENCES "public"."parcelamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lancamentos_parcelamento_id_idx" ON "lancamentos" USING btree ("parcelamento_id");--> statement-breakpoint
ALTER TABLE "lancamentos" ADD CONSTRAINT "parcela_num_consistente_com_parcelamento" CHECK (("lancamentos"."parcela_num" IS NULL) = ("lancamentos"."parcelamento_id" IS NULL));