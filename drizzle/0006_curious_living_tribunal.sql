CREATE TABLE IF NOT EXISTS "body_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "clothing" ADD COLUMN "preview_generation_data" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "body_photos" ADD CONSTRAINT "body_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
