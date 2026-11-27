import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { mediaSourceEnum, mediaTypeEnum } from "./enums";
import { profiles } from "./profiles";

/** Metadatos flexibles por tipo de contenido. */
export type MediaItemMetadata = {
  platforms?: string[];
  genres?: string[];
};

/**
 * Catálogo genérico de juegos, películas y series.
 * Los ítems importados de RAWG/TMDB son de solo lectura para los usuarios;
 * los ítems `manual` pueden crearlos y mantenerlos sus autores.
 */
export const mediaItems = pgTable(
  "media_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: mediaTypeEnum("type").notNull(),
    source: mediaSourceEnum("source").notNull(),
    externalId: text("external_id"),
    title: text("title").notNull(),
    coverUrl: text("cover_url"),
    releaseYear: integer("release_year"),
    metadata: jsonb("metadata")
      .$type<MediaItemMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("media_items_source_external_id_unique")
      .on(table.source, table.externalId)
      .where(sql`${table.externalId} is not null`),
    check(
      "media_items_external_id_required",
      sql`${table.source} = 'manual' or ${table.externalId} is not null`,
    ),
    index("media_items_type_title_idx").on(table.type, table.title),
    pgPolicy("media_items_select_all", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("media_items_insert_manual_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.source} = 'manual' and ${table.createdBy} = ${authUid}`,
    }),
    pgPolicy("media_items_update_manual_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.source} = 'manual' and ${table.createdBy} = ${authUid}`,
      withCheck: sql`${table.source} = 'manual' and ${table.createdBy} = ${authUid}`,
    }),
    pgPolicy("media_items_delete_manual_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.source} = 'manual' and ${table.createdBy} = ${authUid}`,
    }),
  ],
).enableRLS();

export type MediaItemSelect = typeof mediaItems.$inferSelect;
export type MediaItemInsert = typeof mediaItems.$inferInsert;
