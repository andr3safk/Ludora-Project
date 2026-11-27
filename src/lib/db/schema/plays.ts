import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
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
import { entries } from "./entries";
import { playStatusEnum } from "./enums";
import { profiles } from "./profiles";

/**
 * Partida o visionado concreto de una entrada del diario.
 * La FK compuesta `(entry_id, user_id)` garantiza que la partida y la entrada
 * pertenecen al mismo usuario.
 */
export const plays = pgTable(
  "plays",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: playStatusEnum("status").notNull().default("backlog"),
    platform: text("platform"),
    startedOn: date("started_on"),
    finishedOn: date("finished_on"),
    hoursPlayed: numeric("hours_played", {
      precision: 6,
      scale: 1,
      mode: "number",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.entryId, table.userId],
      foreignColumns: [entries.id, entries.userId],
      name: "plays_entry_id_user_id_fk",
    }).onDelete("cascade"),
    // Necesario para la FK compuesta de `sessions(play_id, user_id)`.
    unique("plays_id_user_id_unique").on(table.id, table.userId),
    check(
      "plays_dates_order",
      sql`${table.startedOn} is null or ${table.finishedOn} is null or ${table.finishedOn} >= ${table.startedOn}`,
    ),
    index("plays_user_id_finished_on_idx").on(table.userId, table.finishedOn),
    index("plays_entry_id_idx").on(table.entryId),
    pgPolicy("plays_all_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export type PlaySelect = typeof plays.$inferSelect;
export type PlayInsert = typeof plays.$inferInsert;
