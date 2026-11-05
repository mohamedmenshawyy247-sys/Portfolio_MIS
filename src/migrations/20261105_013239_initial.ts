import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'ar');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_services_icon" AS ENUM('activity', 'shield', 'chart');
  CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_version_icon" AS ENUM('activity', 'shield', 'chart');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_published_locale" AS ENUM('en', 'ar');
  CREATE TYPE "public"."enum_projects_visibility" AS ENUM('public', 'unlisted', 'private');
  CREATE TYPE "public"."enum_projects_review_status" AS ENUM('draft', 'in-review', 'changes-requested', 'approved');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_visibility" AS ENUM('public', 'unlisted', 'private');
  CREATE TYPE "public"."enum__projects_v_version_review_status" AS ENUM('draft', 'in-review', 'changes-requested', 'approved');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_published_locale" AS ENUM('en', 'ar');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'reviewing', 'closed');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_published_locale" AS ENUM('en', 'ar');
  CREATE TYPE "public"."enum_site_settings_default_locale" AS ENUM('en', 'ar');
  CREATE TYPE "public"."enum_site_settings_accent_color" AS ENUM('blue', 'cyan');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "services_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"icon" "enum_services_icon" DEFAULT 'activity',
  	"active" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "services_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_version_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_key" varchar,
  	"version_icon" "enum__services_v_version_icon" DEFAULT 'activity',
  	"version_active" boolean DEFAULT true,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__services_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_services_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_delivered_value" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"service_id" integer,
  	"visibility" "enum_projects_visibility" DEFAULT 'private',
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"review_status" "enum_projects_review_status" DEFAULT 'draft',
  	"cover_id" integer,
  	"demo_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"challenge" varchar,
  	"solution" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"public_media_id" integer,
  	"private_media_id" integer
  );
  
  CREATE TABLE "_projects_v_version_delivered_value" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_service_id" integer,
  	"version_visibility" "enum__projects_v_version_visibility" DEFAULT 'private',
  	"version_featured" boolean DEFAULT false,
  	"version_order" numeric DEFAULT 0,
  	"version_review_status" "enum__projects_v_version_review_status" DEFAULT 'draft',
  	"version_cover_id" integer,
  	"version_demo_u_r_l" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__projects_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_projects_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_challenge" varchar,
  	"version_solution" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"public_media_id" integer,
  	"private_media_id" integer
  );
  
  CREATE TABLE "public_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"approved_for_public" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar
  );
  
  CREATE TABLE "public_media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "private_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"company" varchar,
  	"message" varchar NOT NULL,
  	"status" "enum_leads_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"services_id" integer,
  	"projects_id" integer,
  	"public_media_id" integer,
  	"private_media_id" integer,
  	"leads_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_hero_locales" (
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subline" varchar,
  	"primary_label" varchar,
  	"secondary_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_introduction" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_introduction_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_services_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_services_section_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_featured_projects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 1,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_featured_projects_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_approach_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "homepage_blocks_approach" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_approach_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_impact_section_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "homepage_blocks_impact_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_impact_section_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cta_locales" (
  	"heading" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_homepage_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_homepage_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_hero_locales" (
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subline" varchar,
  	"primary_label" varchar,
  	"secondary_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_introduction" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_introduction_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_services_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_services_section_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_featured_projects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 1,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_featured_projects_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_approach_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_approach" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_approach_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_impact_section_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_impact_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_impact_section_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_cta_locales" (
  	"heading" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__homepage_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_name" varchar DEFAULT 'MIS Department' NOT NULL,
  	"logo_id" integer,
  	"default_locale" "enum_site_settings_default_locale" DEFAULT 'en',
  	"accent_color" "enum_site_settings_accent_color" DEFAULT 'blue',
  	"contact_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"tagline" varchar,
  	"footer_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_features" ADD CONSTRAINT "services_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_locales" ADD CONSTRAINT "services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_features" ADD CONSTRAINT "_services_v_version_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_locales" ADD CONSTRAINT "_services_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_delivered_value" ADD CONSTRAINT "projects_delivered_value_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_id_public_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."public_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_public_media_fk" FOREIGN KEY ("public_media_id") REFERENCES "public"."public_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_private_media_fk" FOREIGN KEY ("private_media_id") REFERENCES "public"."private_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_delivered_value" ADD CONSTRAINT "_projects_v_version_delivered_value_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_service_id_services_id_fk" FOREIGN KEY ("version_service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_cover_id_public_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."public_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_public_media_fk" FOREIGN KEY ("public_media_id") REFERENCES "public"."public_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_private_media_fk" FOREIGN KEY ("private_media_id") REFERENCES "public"."private_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "public_media_locales" ADD CONSTRAINT "public_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."public_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_public_media_fk" FOREIGN KEY ("public_media_id") REFERENCES "public"."public_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_media_fk" FOREIGN KEY ("private_media_id") REFERENCES "public"."private_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero_locales" ADD CONSTRAINT "homepage_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_introduction" ADD CONSTRAINT "homepage_blocks_introduction_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_introduction_locales" ADD CONSTRAINT "homepage_blocks_introduction_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_introduction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_services_section" ADD CONSTRAINT "homepage_blocks_services_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_services_section_locales" ADD CONSTRAINT "homepage_blocks_services_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_services_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_projects" ADD CONSTRAINT "homepage_blocks_featured_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_projects_locales" ADD CONSTRAINT "homepage_blocks_featured_projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_featured_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_approach_steps" ADD CONSTRAINT "homepage_blocks_approach_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_approach"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_approach" ADD CONSTRAINT "homepage_blocks_approach_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_approach_locales" ADD CONSTRAINT "homepage_blocks_approach_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_approach"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_impact_section_items" ADD CONSTRAINT "homepage_blocks_impact_section_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_impact_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_impact_section" ADD CONSTRAINT "homepage_blocks_impact_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_impact_section_locales" ADD CONSTRAINT "homepage_blocks_impact_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_impact_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta" ADD CONSTRAINT "homepage_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta_locales" ADD CONSTRAINT "homepage_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero_locales" ADD CONSTRAINT "_homepage_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_introduction" ADD CONSTRAINT "_homepage_v_blocks_introduction_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_introduction_locales" ADD CONSTRAINT "_homepage_v_blocks_introduction_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_introduction"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_services_section" ADD CONSTRAINT "_homepage_v_blocks_services_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_services_section_locales" ADD CONSTRAINT "_homepage_v_blocks_services_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_services_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_featured_projects" ADD CONSTRAINT "_homepage_v_blocks_featured_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_featured_projects_locales" ADD CONSTRAINT "_homepage_v_blocks_featured_projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_featured_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_approach_steps" ADD CONSTRAINT "_homepage_v_blocks_approach_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_approach"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_approach" ADD CONSTRAINT "_homepage_v_blocks_approach_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_approach_locales" ADD CONSTRAINT "_homepage_v_blocks_approach_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_approach"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_impact_section_items" ADD CONSTRAINT "_homepage_v_blocks_impact_section_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_impact_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_impact_section" ADD CONSTRAINT "_homepage_v_blocks_impact_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_impact_section_locales" ADD CONSTRAINT "_homepage_v_blocks_impact_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_impact_section"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta" ADD CONSTRAINT "_homepage_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta_locales" ADD CONSTRAINT "_homepage_v_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_public_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."public_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "services_features_order_idx" ON "services_features" USING btree ("_order");
  CREATE INDEX "services_features_parent_id_idx" ON "services_features" USING btree ("_parent_id");
  CREATE INDEX "services_features_locale_idx" ON "services_features" USING btree ("_locale");
  CREATE UNIQUE INDEX "services_key_idx" ON "services" USING btree ("key");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services__status_idx" ON "services" USING btree ("_status");
  CREATE UNIQUE INDEX "services_locales_locale_parent_id_unique" ON "services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_locales_parent_id_idx" ON "services_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_features_order_idx" ON "_services_v_version_features" USING btree ("_order");
  CREATE INDEX "_services_v_version_features_parent_id_idx" ON "_services_v_version_features" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_features_locale_idx" ON "_services_v_version_features" USING btree ("_locale");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_key_idx" ON "_services_v" USING btree ("version_key");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v" USING btree ("version__status");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_snapshot_idx" ON "_services_v" USING btree ("snapshot");
  CREATE INDEX "_services_v_published_locale_idx" ON "_services_v" USING btree ("published_locale");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_services_v_locales_locale_parent_id_unique" ON "_services_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_locales_parent_id_idx" ON "_services_v_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_delivered_value_order_idx" ON "projects_delivered_value" USING btree ("_order");
  CREATE INDEX "projects_delivered_value_parent_id_idx" ON "projects_delivered_value" USING btree ("_parent_id");
  CREATE INDEX "projects_delivered_value_locale_idx" ON "projects_delivered_value" USING btree ("_locale");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_service_idx" ON "projects" USING btree ("service_id");
  CREATE INDEX "projects_cover_idx" ON "projects" USING btree ("cover_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects_deleted_at_idx" ON "projects" USING btree ("deleted_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_locales_parent_id_idx" ON "projects_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_public_media_id_idx" ON "projects_rels" USING btree ("public_media_id");
  CREATE INDEX "projects_rels_private_media_id_idx" ON "projects_rels" USING btree ("private_media_id");
  CREATE INDEX "_projects_v_version_delivered_value_order_idx" ON "_projects_v_version_delivered_value" USING btree ("_order");
  CREATE INDEX "_projects_v_version_delivered_value_parent_id_idx" ON "_projects_v_version_delivered_value" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_delivered_value_locale_idx" ON "_projects_v_version_delivered_value" USING btree ("_locale");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_service_idx" ON "_projects_v" USING btree ("version_service_id");
  CREATE INDEX "_projects_v_version_version_cover_idx" ON "_projects_v" USING btree ("version_cover_id");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version_deleted_at_idx" ON "_projects_v" USING btree ("version_deleted_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_snapshot_idx" ON "_projects_v" USING btree ("snapshot");
  CREATE INDEX "_projects_v_published_locale_idx" ON "_projects_v" USING btree ("published_locale");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_locales_parent_id_idx" ON "_projects_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_public_media_id_idx" ON "_projects_v_rels" USING btree ("public_media_id");
  CREATE INDEX "_projects_v_rels_private_media_id_idx" ON "_projects_v_rels" USING btree ("private_media_id");
  CREATE INDEX "public_media_updated_at_idx" ON "public_media" USING btree ("updated_at");
  CREATE INDEX "public_media_created_at_idx" ON "public_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "public_media_filename_idx" ON "public_media" USING btree ("filename");
  CREATE INDEX "public_media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "public_media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "public_media_sizes_card_sizes_card_filename_idx" ON "public_media" USING btree ("sizes_card_filename");
  CREATE UNIQUE INDEX "public_media_locales_locale_parent_id_unique" ON "public_media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "public_media_locales_parent_id_idx" ON "public_media_locales" USING btree ("_parent_id");
  CREATE INDEX "private_media_updated_at_idx" ON "private_media" USING btree ("updated_at");
  CREATE INDEX "private_media_created_at_idx" ON "private_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "private_media_filename_idx" ON "private_media" USING btree ("filename");
  CREATE INDEX "private_media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "private_media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_public_media_id_idx" ON "payload_locked_documents_rels" USING btree ("public_media_id");
  CREATE INDEX "payload_locked_documents_rels_private_media_id_idx" ON "payload_locked_documents_rels" USING btree ("private_media_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_blocks_hero_order_idx" ON "homepage_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_parent_id_idx" ON "homepage_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_path_idx" ON "homepage_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_hero_locales_locale_parent_id_unique" ON "homepage_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_hero_locales_parent_id_idx" ON "homepage_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_introduction_order_idx" ON "homepage_blocks_introduction" USING btree ("_order");
  CREATE INDEX "homepage_blocks_introduction_parent_id_idx" ON "homepage_blocks_introduction" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_introduction_path_idx" ON "homepage_blocks_introduction" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_introduction_locales_locale_parent_id_unique" ON "homepage_blocks_introduction_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_introduction_locales_parent_id_idx" ON "homepage_blocks_introduction_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_services_section_order_idx" ON "homepage_blocks_services_section" USING btree ("_order");
  CREATE INDEX "homepage_blocks_services_section_parent_id_idx" ON "homepage_blocks_services_section" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_services_section_path_idx" ON "homepage_blocks_services_section" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_services_section_locales_locale_parent_id_un" ON "homepage_blocks_services_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_services_section_locales_parent_id_idx" ON "homepage_blocks_services_section_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_projects_order_idx" ON "homepage_blocks_featured_projects" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_projects_parent_id_idx" ON "homepage_blocks_featured_projects" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_projects_path_idx" ON "homepage_blocks_featured_projects" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_featured_projects_locales_locale_parent_id_u" ON "homepage_blocks_featured_projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_featured_projects_locales_parent_id_idx" ON "homepage_blocks_featured_projects_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_approach_steps_order_idx" ON "homepage_blocks_approach_steps" USING btree ("_order");
  CREATE INDEX "homepage_blocks_approach_steps_parent_id_idx" ON "homepage_blocks_approach_steps" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_approach_steps_locale_idx" ON "homepage_blocks_approach_steps" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_approach_order_idx" ON "homepage_blocks_approach" USING btree ("_order");
  CREATE INDEX "homepage_blocks_approach_parent_id_idx" ON "homepage_blocks_approach" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_approach_path_idx" ON "homepage_blocks_approach" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_approach_locales_locale_parent_id_unique" ON "homepage_blocks_approach_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_approach_locales_parent_id_idx" ON "homepage_blocks_approach_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_impact_section_items_order_idx" ON "homepage_blocks_impact_section_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_impact_section_items_parent_id_idx" ON "homepage_blocks_impact_section_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_impact_section_items_locale_idx" ON "homepage_blocks_impact_section_items" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_impact_section_order_idx" ON "homepage_blocks_impact_section" USING btree ("_order");
  CREATE INDEX "homepage_blocks_impact_section_parent_id_idx" ON "homepage_blocks_impact_section" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_impact_section_path_idx" ON "homepage_blocks_impact_section" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_impact_section_locales_locale_parent_id_uniq" ON "homepage_blocks_impact_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_impact_section_locales_parent_id_idx" ON "homepage_blocks_impact_section_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta_order_idx" ON "homepage_blocks_cta" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta_parent_id_idx" ON "homepage_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta_path_idx" ON "homepage_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_cta_locales_locale_parent_id_unique" ON "homepage_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_cta_locales_parent_id_idx" ON "homepage_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
  CREATE INDEX "_homepage_v_blocks_hero_order_idx" ON "_homepage_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero_parent_id_idx" ON "_homepage_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero_path_idx" ON "_homepage_v_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_hero_locales_locale_parent_id_unique" ON "_homepage_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero_locales_parent_id_idx" ON "_homepage_v_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_introduction_order_idx" ON "_homepage_v_blocks_introduction" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_introduction_parent_id_idx" ON "_homepage_v_blocks_introduction" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_introduction_path_idx" ON "_homepage_v_blocks_introduction" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_introduction_locales_locale_parent_id_uni" ON "_homepage_v_blocks_introduction_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_introduction_locales_parent_id_idx" ON "_homepage_v_blocks_introduction_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_services_section_order_idx" ON "_homepage_v_blocks_services_section" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_services_section_parent_id_idx" ON "_homepage_v_blocks_services_section" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_services_section_path_idx" ON "_homepage_v_blocks_services_section" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_services_section_locales_locale_parent_id" ON "_homepage_v_blocks_services_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_services_section_locales_parent_id_idx" ON "_homepage_v_blocks_services_section_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_featured_projects_order_idx" ON "_homepage_v_blocks_featured_projects" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_featured_projects_parent_id_idx" ON "_homepage_v_blocks_featured_projects" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_featured_projects_path_idx" ON "_homepage_v_blocks_featured_projects" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_featured_projects_locales_locale_parent_i" ON "_homepage_v_blocks_featured_projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_featured_projects_locales_parent_id_idx" ON "_homepage_v_blocks_featured_projects_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_approach_steps_order_idx" ON "_homepage_v_blocks_approach_steps" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_approach_steps_parent_id_idx" ON "_homepage_v_blocks_approach_steps" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_approach_steps_locale_idx" ON "_homepage_v_blocks_approach_steps" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_approach_order_idx" ON "_homepage_v_blocks_approach" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_approach_parent_id_idx" ON "_homepage_v_blocks_approach" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_approach_path_idx" ON "_homepage_v_blocks_approach" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_approach_locales_locale_parent_id_unique" ON "_homepage_v_blocks_approach_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_approach_locales_parent_id_idx" ON "_homepage_v_blocks_approach_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_impact_section_items_order_idx" ON "_homepage_v_blocks_impact_section_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_impact_section_items_parent_id_idx" ON "_homepage_v_blocks_impact_section_items" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_impact_section_items_locale_idx" ON "_homepage_v_blocks_impact_section_items" USING btree ("_locale");
  CREATE INDEX "_homepage_v_blocks_impact_section_order_idx" ON "_homepage_v_blocks_impact_section" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_impact_section_parent_id_idx" ON "_homepage_v_blocks_impact_section" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_impact_section_path_idx" ON "_homepage_v_blocks_impact_section" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_impact_section_locales_locale_parent_id_u" ON "_homepage_v_blocks_impact_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_impact_section_locales_parent_id_idx" ON "_homepage_v_blocks_impact_section_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta_order_idx" ON "_homepage_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_cta_parent_id_idx" ON "_homepage_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta_path_idx" ON "_homepage_v_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_cta_locales_locale_parent_id_unique" ON "_homepage_v_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta_locales_parent_id_idx" ON "_homepage_v_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_snapshot_idx" ON "_homepage_v" USING btree ("snapshot");
  CREATE INDEX "_homepage_v_published_locale_idx" ON "_homepage_v" USING btree ("published_locale");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "services_features" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_locales" CASCADE;
  DROP TABLE "_services_v_version_features" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "_services_v_locales" CASCADE;
  DROP TABLE "projects_delivered_value" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_delivered_value" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_locales" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "public_media" CASCADE;
  DROP TABLE "public_media_locales" CASCADE;
  DROP TABLE "private_media" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "homepage_blocks_hero" CASCADE;
  DROP TABLE "homepage_blocks_hero_locales" CASCADE;
  DROP TABLE "homepage_blocks_introduction" CASCADE;
  DROP TABLE "homepage_blocks_introduction_locales" CASCADE;
  DROP TABLE "homepage_blocks_services_section" CASCADE;
  DROP TABLE "homepage_blocks_services_section_locales" CASCADE;
  DROP TABLE "homepage_blocks_featured_projects" CASCADE;
  DROP TABLE "homepage_blocks_featured_projects_locales" CASCADE;
  DROP TABLE "homepage_blocks_approach_steps" CASCADE;
  DROP TABLE "homepage_blocks_approach" CASCADE;
  DROP TABLE "homepage_blocks_approach_locales" CASCADE;
  DROP TABLE "homepage_blocks_impact_section_items" CASCADE;
  DROP TABLE "homepage_blocks_impact_section" CASCADE;
  DROP TABLE "homepage_blocks_impact_section_locales" CASCADE;
  DROP TABLE "homepage_blocks_cta" CASCADE;
  DROP TABLE "homepage_blocks_cta_locales" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_introduction" CASCADE;
  DROP TABLE "_homepage_v_blocks_introduction_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_services_section" CASCADE;
  DROP TABLE "_homepage_v_blocks_services_section_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_featured_projects" CASCADE;
  DROP TABLE "_homepage_v_blocks_featured_projects_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_approach_steps" CASCADE;
  DROP TABLE "_homepage_v_blocks_approach" CASCADE;
  DROP TABLE "_homepage_v_blocks_approach_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_impact_section_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_impact_section" CASCADE;
  DROP TABLE "_homepage_v_blocks_impact_section_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta_locales" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_services_icon";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_version_icon";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum__services_v_published_locale";
  DROP TYPE "public"."enum_projects_visibility";
  DROP TYPE "public"."enum_projects_review_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_visibility";
  DROP TYPE "public"."enum__projects_v_version_review_status";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum__projects_v_published_locale";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_homepage_status";
  DROP TYPE "public"."enum__homepage_v_version_status";
  DROP TYPE "public"."enum__homepage_v_published_locale";
  DROP TYPE "public"."enum_site_settings_default_locale";
  DROP TYPE "public"."enum_site_settings_accent_color";`)
}
