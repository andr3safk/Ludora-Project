import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

/**
 * Perfil público de cada usuario de Supabase Auth.
 * `authUsers` se importa aquí y solo aquí: se usa para la FK a `auth.users`,
 * pero no se reexporta desde `schema/index.ts` para que drizzle-kit no
 * intente crear el schema `auth`.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").notNull().unique(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    timezone: text("timezone").notNull().default("UTC"),
    locale: text("locale").notNull().default("es"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "profiles_username_format",
      sql`${table.username} ~ '^[a-z0-9_]{3,20}$'`,
    ),
    pgPolicy("profiles_select_own_or_public", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid} or ${table.isPublic} = true`,
    }),
    pgPolicy("profiles_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
  ],
).enableRLS();

export type ProfileSelect = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
