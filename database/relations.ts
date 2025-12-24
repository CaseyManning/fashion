import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  bodyPhotos: {
    user: r.one.users({
      from: r.bodyPhotos.userId,
      to: r.users.id,
    }),
  },
  users: {
    bodyPhotos: r.many.bodyPhotos(),
    clothingUserId: r.many.clothing({
      alias: "clothing_userId_users_id",
    }),
    inspoPhotos: r.many.inspoPhotos(),
    outfitCollections: r.many.outfitCollection(),
    outfitGenerations: r.many.outfitGenerations(),
    clothingViaUploadedClothingPhotos: r.many.clothing({
      alias: "clothing_id_users_id_via_uploadedClothingPhotos",
    }),
  },
  clothing: {
    user: r.one.users({
      from: r.clothing.userId,
      to: r.users.id,
      alias: "clothing_userId_users_id",
    }),
    outfitGenerations: r.many.outfitGenerations({
      from: r.clothing.id.through(r.outfitsToClothing.clothingId),
      to: r.outfitGenerations.id.through(r.outfitsToClothing.outfitId),
    }),
    users: r.many.users({
      from: r.clothing.id.through(r.uploadedClothingPhotos.clothingId),
      to: r.users.id.through(r.uploadedClothingPhotos.userId),
      alias: "clothing_id_users_id_via_uploadedClothingPhotos",
    }),
    uploadedPhotos: r.many.uploadedClothingPhotos({
      from: r.clothing.id.through(r.uploadedClothingPhotos.clothingId),
      to: r.uploadedClothingPhotos.id,
    }),
  },
  inspoPhotos: {
    user: r.one.users({
      from: r.inspoPhotos.userId,
      to: r.users.id,
    }),
  },
  outfitCollection: {
    user: r.one.users({
      from: r.outfitCollection.userId,
      to: r.users.id,
    }),
    outfitGenerations: r.many.outfitGenerations({
      from: r.outfitCollection.id.through(r.outfitsToCollection.collectionId),
      to: r.outfitGenerations.id.through(r.outfitsToCollection.outfitId),
    }),
  },
  outfitGenerations: {
    user: r.one.users({
      from: r.outfitGenerations.userId,
      to: r.users.id,
    }),
    clothing: r.many.clothing(),
    outfitCollections: r.many.outfitCollection(),
  },
}));
