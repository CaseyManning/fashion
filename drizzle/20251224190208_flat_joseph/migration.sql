--> statement-breakpoint
CREATE TYPE "category" AS ENUM('tops', 'bottoms', 'dresses', 'outerwear', 'accessories', 'shoes', 'bags', 'hats', 'other');--> statement-breakpoint
CREATE TYPE "collection_type" AS ENUM('daily', 'prompt', 'custom', 'other');--> statement-breakpoint
CREATE TABLE "body_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "clothing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"brand" varchar(255),
	"preview_img" varchar(255),
	"category" "category" DEFAULT 'other'::"category" NOT NULL,
	"name" varchar(255),
	"notes" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"favorite" boolean DEFAULT false,
	"rating" integer DEFAULT 0,
	"color_text" text,
	"color_hex" text,
	"processing" boolean DEFAULT true,
	"dimensions" text,
	"preview_generation_data" jsonb,
	CONSTRAINT "rating_check" CHECK (CHECK (((rating >= 0) AND (rating <= 5))))
);
--> statement-breakpoint

--> statement-breakpoint
CREATE TABLE "guestBook" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "guestBook_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL CONSTRAINT "guestBook_email_unique" UNIQUE
);
--> statement-breakpoint
CREATE TABLE "inspo_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar(255),
	"personal" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "outfit_collection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "collection_type" DEFAULT 'other'::"collection_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfit_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"prompt" text,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "outfits_to_clothing" (
	"outfit_id" uuid,
	"clothing_id" uuid,
	CONSTRAINT "outfits_to_clothing_outfit_id_clothing_id_pk" PRIMARY KEY("outfit_id","clothing_id")
);
--> statement-breakpoint
CREATE TABLE "outfits_to_collection" (
	"outfit_id" uuid,
	"collection_id" uuid,
	CONSTRAINT "outfits_to_collection_outfit_id_collection_id_pk" PRIMARY KEY("outfit_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "uploaded_clothing_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar(255),
	"clothing_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(255) NOT NULL CONSTRAINT "users_username_unique" UNIQUE,
	"email" varchar(255) NOT NULL CONSTRAINT "users_email_unique" UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"height" text,
	"weight" text,
	"waist" text,
	"bust" text,
	"hip" text
);
--> statement-breakpoint
ALTER TABLE "body_photos" ADD CONSTRAINT "body_photos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "clothing" ADD CONSTRAINT "clothing_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inspo_photos" ADD CONSTRAINT "inspo_photos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "outfit_collection" ADD CONSTRAINT "outfit_collection_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "outfit_generations" ADD CONSTRAINT "outfit_generations_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "outfits_to_clothing" ADD CONSTRAINT "outfits_to_clothing_outfit_id_outfit_generations_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfit_generations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "outfits_to_clothing" ADD CONSTRAINT "outfits_to_clothing_clothing_id_clothing_id_fkey" FOREIGN KEY ("clothing_id") REFERENCES "clothing"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "outfits_to_collection" ADD CONSTRAINT "outfits_to_collection_outfit_id_outfit_generations_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfit_generations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "outfits_to_collection" ADD CONSTRAINT "outfits_to_collection_collection_id_outfit_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "outfit_collection"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "uploaded_clothing_photos" ADD CONSTRAINT "uploaded_clothing_photos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "uploaded_clothing_photos" ADD CONSTRAINT "uploaded_clothing_photos_clothing_id_clothing_id_fkey" FOREIGN KEY ("clothing_id") REFERENCES "clothing"("id") ON DELETE CASCADE;