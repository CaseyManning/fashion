import {
  pgSchema,
  pgEnum,
  pgTable,
  uuid,
  integer,
  serial,
  text,
  varchar,
  bigint,
  timestamp,
  boolean,
  jsonb,
  foreignKey,
  primaryKey,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const drizzle = pgSchema("drizzle");
export const category = pgEnum("category", [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "accessories",
  "shoes",
  "bags",
  "hats",
  "other",
]);
export const collectionType = pgEnum("collection_type", [
  "daily",
  "prompt",
  "custom",
  "other",
]);

export const drizzleMigrationsInDrizzle = drizzle.table(
  "__drizzle_migrations",
  {
    id: serial().primaryKey(),
    hash: text().notNull(),
    createdAt: bigint("created_at", { mode: "number" }),
  }
);

export const bodyPhotos = pgTable("body_photos", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
  key: varchar({ length: 255 }),
});

export type PreviewGenerationData = {
  model: string;
  prompt: string;
};

export const clothing = pgTable(
  "clothing",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brand: varchar({ length: 255 }),
    previewImg: varchar("preview_img", { length: 255 }),
    category: category().default("other").notNull(),
    name: varchar({ length: 255 }),
    notes: text(),
    description: text(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`now()`)
      .notNull(),
    favorite: boolean().default(false),
    rating: integer().default(0),
    colorText: text("color_text"),
    colorHex: text("color_hex"),
    processing: boolean().default(true),
    dimensions: text(),
    previewGenerationData: jsonb(
      "preview_generation_data"
    ).$type<PreviewGenerationData>(),
  },
  (table) => [
    check("rating_check", sql`CHECK (((rating >= 0) AND (rating <= 5)))`),
  ]
);

export const guestBook = pgTable(
  "guestBook",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
  },
  (table) => [unique("guestBook_email_unique").on(table.email)]
);

export const inspoPhotos = pgTable("inspo_photos", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
  key: varchar({ length: 255 }),
  personal: boolean().default(false).notNull(),
  notes: text(),
});

export const outfitCollection = pgTable("outfit_collection", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  type: collectionType().default("other").notNull(),
});

export const outfitGenerations = pgTable("outfit_generations", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  prompt: text(),
  image: varchar({ length: 255 }),
});

export const outfitsToClothing = pgTable(
  "outfits_to_clothing",
  {
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfitGenerations.id, { onDelete: "cascade" }),
    clothingId: uuid("clothing_id")
      .notNull()
      .references(() => clothing.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.outfitId, table.clothingId],
      name: "outfits_to_clothing_outfit_id_clothing_id_pk",
    }),
  ]
);

export const outfitsToCollection = pgTable(
  "outfits_to_collection",
  {
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfitGenerations.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => outfitCollection.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.outfitId, table.collectionId],
      name: "outfits_to_collection_outfit_id_collection_id_pk",
    }),
  ]
);

export const uploadedClothingPhotos = pgTable("uploaded_clothing_photos", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
  key: varchar({ length: 255 }),
  clothingId: uuid("clothing_id")
    .notNull()
    .references(() => clothing.id, { onDelete: "cascade" }),
});

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey(),
    username: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`now()`)
      .notNull(),
    height: text(),
    weight: text(),
    waist: text(),
    bust: text(),
    hip: text(),
  },
  (table) => [
    unique("users_email_unique").on(table.email),
    unique("users_username_unique").on(table.username),
  ]
);
