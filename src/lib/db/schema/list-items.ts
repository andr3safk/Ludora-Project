import { sql } from "drizzle-orm";
import {
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { lists } from "./lists";
import { mediaItems } from "./media";

/**
 * Ítem dentro de una lista. La PK compuesta impide duplicar el mismo ítem
 * en la misma lista; `position` define el orden visible.
 */
export const listItems = pgTable(
  "list_items",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    position: integer("position").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.listId, table.mediaItemId],
      name: "list_items_list_id_media_item_id_pk",
    }),
    pgPolicy("list_items_all_owner", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${lists} where ${lists.id} = ${table.listId} and ${lists.userId} = ${authUid})`,
      withCheck: sql`exists (select 1 from ${lists} where ${lists.id} = ${table.listId} and ${lists.userId} = ${authUid})`,
    }),
  ],
).enableRLS();

export type ListItemSelect = typeof listItems.$inferSelect;
export type ListItemInsert = typeof listItems.$inferInsert;
