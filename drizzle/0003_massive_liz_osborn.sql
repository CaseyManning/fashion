CREATE TABLE IF NOT EXISTS "uploaded_clothing_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar(255),
	"clothing_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploaded_clothing_photos" ADD CONSTRAINT "uploaded_clothing_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploaded_clothing_photos" ADD CONSTRAINT "uploaded_clothing_photos_clothing_id_clothing_id_fk" FOREIGN KEY ("clothing_id") REFERENCES "public"."clothing"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "clothing" DROP COLUMN IF EXISTS "original_upload_img";