CREATE TABLE IF NOT EXISTS "inspo_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar(255),
	"personal" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "height" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weight" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "waist" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bust" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hip" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inspo_photos" ADD CONSTRAINT "inspo_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
