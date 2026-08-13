CREATE TABLE IF NOT EXISTS "security_scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid,
  "actor_user_id" uuid,
  "project_label" text DEFAULT 'workspace' NOT NULL,
  "overall_score" integer NOT NULL,
  "grade" text NOT NULL,
  "summary" text DEFAULT '' NOT NULL,
  "finding_count" integer DEFAULT 0 NOT NULL,
  "source" text DEFAULT 'mcp' NOT NULL,
  "report" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security_scans" ADD CONSTRAINT "security_scans_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "security_scans" ADD CONSTRAINT "security_scans_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
