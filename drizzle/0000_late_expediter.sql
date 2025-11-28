CREATE TYPE "public"."category" AS ENUM('tops', 'bottoms', 'dresses', 'outerwear', 'accessories', 'shoes', 'bags', 'hats', 'other');--> statement-breakpoint
CREATE TYPE "public"."collection_type" AS ENUM('daily', 'prompt', 'custom', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clothing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand" varchar(255),
	"original_upload_img" varchar(255),
	"preview_img" varchar(255),
	"category" "category" DEFAULT 'other' NOT NULL,
	"name" varchar(255),
	"notes" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"favorite" boolean DEFAULT false,
	"rating" integer DEFAULT 0,
	CONSTRAINT "rating_check" CHECK (rating >= 0 AND rating <= 5)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guestBook" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "guestBook_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "guestBook_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outfit_collection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "collection_type" DEFAULT 'other' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outfit_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"prompt" text,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outfits_to_clothing" (
	"outfit_id" uuid NOT NULL,
	"clothing_id" uuid NOT NULL,
	CONSTRAINT "outfits_to_clothing_outfit_id_clothing_id_pk" PRIMARY KEY("outfit_id","clothing_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outfits_to_collection" (
	"outfit_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	CONSTRAINT "outfits_to_collection_outfit_id_collection_id_pk" PRIMARY KEY("outfit_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clothing" ADD CONSTRAINT "clothing_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outfit_collection" ADD CONSTRAINT "outfit_collection_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outfit_generations" ADD CONSTRAINT "outfit_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outfits_to_clothing" ADD CONSTRAINT "outfits_to_clothing_outfit_id_outfit_generations_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfit_generations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outfits_to_clothing" ADD CONSTRAINT "outfits_to_clothing_clothing_id_clothing_id_fk" FOREIGN KEY ("clothing_id") REFERENCES "public"."clothing"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outfits_to_collection" ADD CONSTRAINT "outfits_to_collection_outfit_id_outfit_generations_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfit_generations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outfits_to_collection" ADD CONSTRAINT "outfits_to_collection_collection_id_outfit_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."outfit_collection"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
