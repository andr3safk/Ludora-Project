CREATE TYPE "public"."media_source" AS ENUM('rawg', 'tmdb', 'manual');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('game', 'movie', 'series');--> statement-breakpoint
CREATE TYPE "public"."play_status" AS ENUM('playing', 'completed', 'paused', 'dropped', 'backlog');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "profiles_username_format" CHECK ("profiles"."username" ~ '^[a-z0-9_]{3,20}$')
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "media_type" NOT NULL,
	"source" "media_source" NOT NULL,
	"external_id" text,
	"title" text NOT NULL,
	"cover_url" text,
	"release_year" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_items_external_id_required" CHECK ("media_items"."source" = 'manual' or "media_items"."external_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "media_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"media_item_id" uuid NOT NULL,
	"rating" numeric(2, 1),
	"review" text,
	"has_spoilers" boolean DEFAULT false NOT NULL,
	"review_visibility" "visibility" DEFAULT 'private' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"vibes" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entries_user_id_media_item_id_unique" UNIQUE("user_id","media_item_id"),
	CONSTRAINT "entries_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "entries_rating_range" CHECK ("entries"."rating" is null or ("entries"."rating" >= 0.5 and "entries"."rating" <= 5.0)),
	CONSTRAINT "entries_rating_step" CHECK ("entries"."rating" is null or ("entries"."rating" * 10) % 5 = 0),
	CONSTRAINT "entries_review_length" CHECK ("entries"."review" is null or char_length("entries"."review") <= 5000)
);
--> statement-breakpoint
ALTER TABLE "entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "plays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "play_status" DEFAULT 'backlog' NOT NULL,
	"platform" text,
	"started_on" date,
	"finished_on" date,
	"hours_played" numeric(6, 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plays_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "plays_dates_order" CHECK ("plays"."started_on" is null or "plays"."finished_on" is null or "plays"."finished_on" >= "plays"."started_on")
);
--> statement-breakpoint
ALTER TABLE "plays" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"play_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"played_on" date NOT NULL,
	"duration_minutes" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_duration_minutes_positive" CHECK ("sessions"."duration_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"media_type" "media_type" DEFAULT 'game' NOT NULL,
	"target_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_user_id_year_media_type_unique" UNIQUE("user_id","year","media_type"),
	CONSTRAINT "goals_target_count_positive" CHECK ("goals"."target_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lists_user_id_slug_unique" UNIQUE("user_id","slug")
);
--> statement-breakpoint
ALTER TABLE "lists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "list_items" (
	"list_id" uuid NOT NULL,
	"media_item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "list_items_list_id_media_item_id_pk" PRIMARY KEY("list_id","media_item_id")
);
--> statement-breakpoint
ALTER TABLE "list_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_entry_id_user_id_fk" FOREIGN KEY ("entry_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_play_id_user_id_fk" FOREIGN KEY ("play_id","user_id") REFERENCES "public"."plays"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_items_source_external_id_unique" ON "media_items" USING btree ("source","external_id") WHERE "media_items"."external_id" is not null;--> statement-breakpoint
CREATE INDEX "media_items_type_title_idx" ON "media_items" USING btree ("type","title");--> statement-breakpoint
CREATE INDEX "entries_user_id_idx" ON "entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plays_user_id_finished_on_idx" ON "plays" USING btree ("user_id","finished_on");--> statement-breakpoint
CREATE INDEX "plays_entry_id_idx" ON "plays" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "sessions_play_id_idx" ON "sessions" USING btree ("play_id");--> statement-breakpoint
CREATE INDEX "goals_user_id_year_idx" ON "goals" USING btree ("user_id","year");--> statement-breakpoint
CREATE INDEX "lists_user_id_idx" ON "lists" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "profiles_select_own_or_public" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."id" = (select auth.uid()) or "profiles"."is_public" = true);--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."id" = (select auth.uid())) WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "media_items_select_all" ON "media_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "media_items_insert_manual_own" ON "media_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("media_items"."source" = 'manual' and "media_items"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "media_items_update_manual_own" ON "media_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("media_items"."source" = 'manual' and "media_items"."created_by" = (select auth.uid())) WITH CHECK ("media_items"."source" = 'manual' and "media_items"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "media_items_delete_manual_own" ON "media_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("media_items"."source" = 'manual' and "media_items"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "entries_all_own" ON "entries" AS PERMISSIVE FOR ALL TO "authenticated" USING ("entries"."user_id" = (select auth.uid())) WITH CHECK ("entries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "plays_all_own" ON "plays" AS PERMISSIVE FOR ALL TO "authenticated" USING ("plays"."user_id" = (select auth.uid())) WITH CHECK ("plays"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "sessions_all_own" ON "sessions" AS PERMISSIVE FOR ALL TO "authenticated" USING ("sessions"."user_id" = (select auth.uid())) WITH CHECK ("sessions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "goals_all_own" ON "goals" AS PERMISSIVE FOR ALL TO "authenticated" USING ("goals"."user_id" = (select auth.uid())) WITH CHECK ("goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "lists_all_own" ON "lists" AS PERMISSIVE FOR ALL TO "authenticated" USING ("lists"."user_id" = (select auth.uid())) WITH CHECK ("lists"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "list_items_all_owner" ON "list_items" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "lists" where "lists"."id" = "list_items"."list_id" and "lists"."user_id" = (select auth.uid()))) WITH CHECK (exists (select 1 from "lists" where "lists"."id" = "list_items"."list_id" and "lists"."user_id" = (select auth.uid())));