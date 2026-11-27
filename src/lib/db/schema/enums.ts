import { pgEnum } from "drizzle-orm/pg-core";

/** Tipo de contenido del catálogo. Ludora nace con juegos y se amplía a películas y series. */
export const mediaTypeEnum = pgEnum("media_type", ["game", "movie", "series"]);

/** Origen de los datos del catálogo. `manual` indica que lo creó un usuario. */
export const mediaSourceEnum = pgEnum("media_source", ["rawg", "tmdb", "manual"]);

/** Estado de una partida/visionado dentro del diario. */
export const playStatusEnum = pgEnum("play_status", [
  "playing",
  "completed",
  "paused",
  "dropped",
  "backlog",
]);

/** Visibilidad de una reseña o lista. */
export const visibilityEnum = pgEnum("visibility", ["public", "private"]);

export type MediaType = (typeof mediaTypeEnum.enumValues)[number];
export type MediaSource = (typeof mediaSourceEnum.enumValues)[number];
export type PlayStatus = (typeof playStatusEnum.enumValues)[number];
export type Visibility = (typeof visibilityEnum.enumValues)[number];
