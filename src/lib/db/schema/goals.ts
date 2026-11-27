import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { mediaTypeEnum } from "./enums";
import { profiles } from "./profiles";

/** Meta anual por tipo de contenido (por defecto, juegos). */
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull().default("game"),
    targetCount: integer("target_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("goals_user_id_year_media_type_unique").on(
      table.userId,
      table.year,
      table.mediaType,
    ),
    check("goals_target_count_positive", sql`${table.targetCount} > 0`),
    index("goals_user_id_year_idx").on(table.userId, table.year),
    pgPolicy("goals_all_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export type GoalSelect = typeof goals.$inferSelect;
export type GoalInsert = typeof goals.$inferInsert;
