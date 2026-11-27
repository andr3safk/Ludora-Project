import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  numeric,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { visibilityEnum } from "./enums";
import { mediaItems } from "./media";
import { profiles } from "./profiles";

/**
 * Entrada del diario: la relación única entre un usuario y un ítem del catálogo.
 * Contiene la reseña y la calificación; los estados de juego y las sesiones
 * viven en `plays` / `sessions`.
 */
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
    review: text("review"),
    hasSpoilers: boolean("has_spoilers").notNull().default(false),
    reviewVisibility: visibilityEnum("review_visibility")
      .notNull()
      .default("private"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    vibes: text("vibes").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("entries_user_id_media_item_id_unique").on(
      table.userId,
      table.mediaItemId,
    ),
    // Necesario para la FK compuesta de `plays(entry_id, user_id)`.
    unique("entries_id_user_id_unique").on(table.id, table.userId),
    check(
      "entries_rating_range",
      sql`${table.rating} is null or (${table.rating} >= 0.5 and ${table.rating} <= 5.0)`,
    ),
    check(
      "entries_rating_step",
      sql`${table.rating} is null or (${table.rating} * 10) % 5 = 0`,
    ),
    check(
      "entries_review_length",
      sql`${table.review} is null or char_length(${table.review}) <= 5000`,
    ),
    index("entries_user_id_idx").on(table.userId),
    pgPolicy("entries_all_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export type EntrySelect = typeof entries.$inferSelect;
export type EntryInsert = typeof entries.$inferInsert;
