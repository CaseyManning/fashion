import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const guestBook = pgTable("guestBook", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  height: text("height"),
  weight: text("weight"),
  waist: text("waist"),
  bust: text("bust"),
  hip: text("hip"),
});

export const inspoPhotos = pgTable("inspo_photos", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  key: varchar("key", { length: 255 }),
  personal: boolean("personal").default(false).notNull(),
  notes: text("notes"),
});

export const bodyPhotos = pgTable("body_photos", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  key: varchar("key", { length: 255 }),
});

export const bodyPhotoRelations = relations(bodyPhotos, ({ one }) => ({
  user: one(users, {
    fields: [bodyPhotos.userId],
    references: [users.id],
  }),
}));

export const inspoPhotoRelations = relations(inspoPhotos, ({ one }) => ({
  user: one(users, {
    fields: [inspoPhotos.userId],
    references: [users.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  clothing: many(clothing),
  inspoPhotos: many(inspoPhotos),
  bodyPhotos: many(bodyPhotos),
}));

export const clothingCategories = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "accessories",
  "shoes",
  "bags",
  "hats",
  "other",
] as const;

export const clothingCategory = pgEnum("category", clothingCategories);

export const clothing = pgTable(
  "clothing",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brand: varchar("brand", { length: 255 }),
    previewImg: varchar("preview_img", { length: 255 }),
    processing: boolean("processing").default(true),
    category: clothingCategory("category").notNull().default("other"),
    name: varchar("name", { length: 255 }),
    dimensions: text("dimensions"),
    notes: text("notes"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    colorText: text("color_text"),
    colorHex: text("color_hex"),
    favorite: boolean("favorite").default(false),
    rating: integer("rating").default(0),
    previewGenerationData: jsonb("preview_generation_data").$type<{
      prompt: string;
      model: string;
    }>(),
  },
  () => [check("rating_check", sql`rating >= 0 AND rating <= 5`)]
);

export const uploadedClothingPhotos = pgTable("uploaded_clothing_photos", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  key: varchar("key", { length: 255 }),
  clothingId: uuid("clothing_id")
    .notNull()
    .references(() => clothing.id, { onDelete: "cascade" }),
});

export const clothingRelations = relations(clothing, ({ one, many }) => ({
  user: one(users, {
    fields: [clothing.userId],
    references: [users.id],
  }),
  uploadedPhotos: many(uploadedClothingPhotos),
}));

export const uploadedClothingPhotosRelations = relations(
  uploadedClothingPhotos,
  ({ one }) => ({
    author: one(users, {
      fields: [uploadedClothingPhotos.userId],
      references: [users.id],
    }),
    clothing: one(clothing, {
      fields: [uploadedClothingPhotos.clothingId],
      references: [clothing.id],
    }),
  })
);

export const outfitGenerations = pgTable("outfit_generations", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  prompt: text("prompt"),
  image: varchar("image", { length: 255 }),
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
  (t) => [primaryKey({ columns: [t.outfitId, t.clothingId] })]
);

export const outfitGenerationsRelations = relations(
  outfitGenerations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [outfitGenerations.userId],
      references: [users.id],
    }),
    outfitsToClothing: many(outfitsToClothing),
  })
);

export const outfitsToClothingRelations = relations(
  outfitsToClothing,
  ({ one }) => ({
    outfit: one(outfitGenerations, {
      fields: [outfitsToClothing.outfitId],
      references: [outfitGenerations.id],
    }),
    clothing: one(clothing, {
      fields: [outfitsToClothing.clothingId],
      references: [clothing.id],
    }),
  })
);

export const collectionType = pgEnum("collection_type", [
  "daily",
  "prompt",
  "custom",
  "other",
]);

export const outfitCollection = pgTable("outfit_collection", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: collectionType("type").notNull().default("other"),
});

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
  (t) => [primaryKey({ columns: [t.outfitId, t.collectionId] })]
);
