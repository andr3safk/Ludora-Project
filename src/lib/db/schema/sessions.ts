import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { plays } from "./plays";

/**
 * Sesión de juego o visionado dentro de una partida.
 * La FK compuesta `(play_id, user_id)` evita registrar sesiones en partidas
 * de otros usuarios.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playId: uuid("play_id").notNull(),
    userId: uuid("user_id").notNull(),
    playedOn: date("played_on").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.playId, table.userId],
      foreignColumns: [plays.id, plays.userId],
      name: "sessions_play_id_user_id_fk",
    }).onDelete("cascade"),
    check("sessions_duration_minutes_positive", sql`${table.durationMinutes} > 0`),
    index("sessions_play_id_idx").on(table.playId),
    pgPolicy("sessions_all_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export type SessionSelect = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
