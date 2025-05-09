const lines = `
   CREATE TYPE "public"."enum__videos_v_published_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__categories_v_published_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__morning_notes_v_published_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__tvapps_v_published_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__content_shelves_v_published_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__testimonials_v_published_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__popups_v_published_locale" AS ENUM('en', 'es');
  ALTER TYPE "public"."enum_pages_blocks_cta_variant" ADD VALUE 'copy';
  ALTER TYPE "public"."enum__pages_v_blocks_cta_variant" ADD VALUE 'copy';
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"global_slug" varchar,
  \t"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  \t"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"videos_id" integer,
  \t"pages_id" integer,
  \t"categories_id" integer,
  \t"media_id" integer,
  \t"morning_notes_id" integer,
  \t"users_id" integer,
  \t"tvapps_id" integer,
  \t"content_shelves_id" integer,
  \t"testimonials_id" integer,
  \t"popups_id" integer,
  \t"audit_logs_id" integer,
  \t"reviews_id" integer,
  \t"workflows_id" integer,
  \t"forms_id" integer,
  \t"form_submissions_id" integer
  );

  ALTER TABLE "videos_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_videos_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_categories_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "morning_notes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_morning_notes_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tvapps_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_tvapps_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "content_shelves_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_content_shelves_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_popups_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_navigation_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mobile_hero_banner_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "videos_rels" CASCADE;
  DROP TABLE "_videos_v_rels" CASCADE;
  DROP TABLE "categories_rels" CASCADE;
  DROP TABLE "_categories_v_rels" CASCADE;
  DROP TABLE "morning_notes_rels" CASCADE;
  DROP TABLE "_morning_notes_v_rels" CASCADE;
  DROP TABLE "tvapps_rels" CASCADE;
  DROP TABLE "_tvapps_v_rels" CASCADE;
  DROP TABLE "content_shelves_rels" CASCADE;
  DROP TABLE "_content_shelves_v_rels" CASCADE;
  DROP TABLE "_testimonials_v_rels" CASCADE;
  DROP TABLE "_popups_v_rels" CASCADE;
  DROP TABLE "form_submissions_rels" CASCADE;
  DROP TABLE "site_navigation_rels" CASCADE;
  DROP TABLE "mobile_hero_banner_rels" CASCADE;
  ALTER TABLE "videos_timestamps_locales" DROP CONSTRAINT "videos_timestamps_locales_locale_parent_id_unique";
  ALTER TABLE "videos_locales" DROP CONSTRAINT "videos_locales_locale_parent_id_unique";
  ALTER TABLE "_videos_v_version_timestamps_locales" DROP CONSTRAINT "_videos_v_version_timestamps_locales_locale_parent_id_unique";
  ALTER TABLE "_videos_v_locales" DROP CONSTRAINT "_videos_v_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_checkbox_locales" DROP CONSTRAINT "forms_blocks_checkbox_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_country_locales" DROP CONSTRAINT "forms_blocks_country_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_email_locales" DROP CONSTRAINT "forms_blocks_email_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_message_locales" DROP CONSTRAINT "forms_blocks_message_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_number_locales" DROP CONSTRAINT "forms_blocks_number_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_select_options_locales" DROP CONSTRAINT "forms_blocks_select_options_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_select_locales" DROP CONSTRAINT "forms_blocks_select_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_state_locales" DROP CONSTRAINT "forms_blocks_state_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_text_locales" DROP CONSTRAINT "forms_blocks_text_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_textarea_locales" DROP CONSTRAINT "forms_blocks_textarea_locales_locale_parent_id_unique";
  ALTER TABLE "forms_blocks_date_locales" DROP CONSTRAINT "forms_blocks_date_locales_locale_parent_id_unique";
  ALTER TABLE "forms_emails_locales" DROP CONSTRAINT "forms_emails_locales_locale_parent_id_unique";
  ALTER TABLE "forms_locales" DROP CONSTRAINT "forms_locales_locale_parent_id_unique";
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_media_fk";

  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_videos_fk";

  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_forms_fk";

  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_content_shelves_fk";

  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_users_fk";

  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_pages_fk";

  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_media_fk";

  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_videos_fk";

  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_forms_fk";

  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_content_shelves_fk";

  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_users_fk";

  DROP INDEX IF EXISTS "pages_rels_media_id_idx";
  DROP INDEX IF EXISTS "pages_rels_videos_id_idx";
  DROP INDEX IF EXISTS "pages_rels_forms_id_idx";
  DROP INDEX IF EXISTS "pages_rels_content_shelves_id_idx";
  DROP INDEX IF EXISTS "pages_rels_users_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_pages_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_media_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_videos_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_forms_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_content_shelves_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_users_id_idx";
  DROP INDEX IF EXISTS "videos_title_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_title_idx";
  ALTER TABLE "videos" ALTER COLUMN "feature_on_homepage" SET DEFAULT false;
  ALTER TABLE "videos" ALTER COLUMN "must_see" SET DEFAULT false;
  ALTER TABLE "videos" ALTER COLUMN "feature_on_library" SET DEFAULT false;
  ALTER TABLE "videos" ALTER COLUMN "paywall" SET DEFAULT false;
  ALTER TABLE "videos" ALTER COLUMN "gift_video_end" SET DEFAULT 0;
  ALTER TABLE "videos" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_videos_v" ALTER COLUMN "version_feature_on_homepage" SET DEFAULT false;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_must_see" SET DEFAULT false;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_feature_on_library" SET DEFAULT false;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_paywall" SET DEFAULT false;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_gift_video_end" SET DEFAULT 0;
  ALTER TABLE "_videos_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "pages_blocks_rich_text" ALTER COLUMN "variant" SET DEFAULT 'default';
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "controls" SET DEFAULT true;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "autoplay" SET DEFAULT false;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "loop" SET DEFAULT false;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "preload" SET DEFAULT false;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "muted" SET DEFAULT false;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "lazy" SET DEFAULT false;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "autoplay" SET DEFAULT true;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_title" SET DEFAULT true;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_description" SET DEFAULT true;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_date" SET DEFAULT false;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_category" SET DEFAULT false;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_location" SET DEFAULT false;
  ALTER TABLE "pages_blocks_events_list_events" ALTER COLUMN "event_status" SET DEFAULT 'available';
  ALTER TABLE "pages_blocks_slides_grid_slides" ALTER COLUMN "show_run_time" SET DEFAULT false;
  ALTER TABLE "pages_blocks_slides_grid_slides" ALTER COLUMN "show_button" SET DEFAULT false;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_non_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_non_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "pages_blocks_tvapps" ALTER COLUMN "color_scheme" SET DEFAULT 'light';
  ALTER TABLE "pages_blocks_event_tickets" ALTER COLUMN "status" SET DEFAULT 'available';
  ALTER TABLE "pages_blocks_continue_watching" ALTER COLUMN "videos_limit" SET DEFAULT 2;
  ALTER TABLE "pages_blocks_latest_videos" ALTER COLUMN "feature_first_video" SET DEFAULT true;
  ALTER TABLE "pages_blocks_trailer" ALTER COLUMN "autoplay" SET DEFAULT true;
  ALTER TABLE "pages" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_pages_v_blocks_rich_text" ALTER COLUMN "variant" SET DEFAULT 'default';
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "controls" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "autoplay" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "loop" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "preload" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "muted" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "lazy" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "autoplay" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_title" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_description" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_date" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_category" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_location" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_events_list_events" ALTER COLUMN "event_status" SET DEFAULT 'available';
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" ALTER COLUMN "show_run_time" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" ALTER COLUMN "show_button" SET DEFAULT false;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_non_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_non_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_subscriber_show_play_icon" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_tvapps" ALTER COLUMN "color_scheme" SET DEFAULT 'light';
  ALTER TABLE "_pages_v_blocks_event_tickets" ALTER COLUMN "status" SET DEFAULT 'available';
  ALTER TABLE "_pages_v_blocks_continue_watching" ALTER COLUMN "videos_limit" SET DEFAULT 2;
  ALTER TABLE "_pages_v_blocks_latest_videos" ALTER COLUMN "feature_first_video" SET DEFAULT true;
  ALTER TABLE "_pages_v_blocks_trailer" ALTER COLUMN "autoplay" SET DEFAULT true;
  ALTER TABLE "_pages_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "categories" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_categories_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "morning_notes_blocks_rich_text" ALTER COLUMN "variant" SET DEFAULT 'default';
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "controls" SET DEFAULT true;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "autoplay" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "loop" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "preload" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "muted" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "lazy" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "autoplay" SET DEFAULT true;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_title" SET DEFAULT true;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_description" SET DEFAULT true;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_date" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_category" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_location" SET DEFAULT false;
  ALTER TABLE "morning_notes_blocks_events_list_events" ALTER COLUMN "event_status" SET DEFAULT 'available';
  ALTER TABLE "morning_notes" ALTER COLUMN "paywall" SET DEFAULT false;
  ALTER TABLE "morning_notes" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_morning_notes_v_blocks_rich_text" ALTER COLUMN "variant" SET DEFAULT 'default';
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "controls" SET DEFAULT true;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "autoplay" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "loop" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "preload" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "muted" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "lazy" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "autoplay" SET DEFAULT true;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_title" SET DEFAULT true;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_description" SET DEFAULT true;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_date" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_category" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_location" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v_blocks_events_list_events" ALTER COLUMN "event_status" SET DEFAULT 'available';
  ALTER TABLE "_morning_notes_v" ALTER COLUMN "version_paywall" SET DEFAULT false;
  ALTER TABLE "_morning_notes_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'viewer';
  ALTER TABLE "tvapps" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_tvapps_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "content_shelves" ALTER COLUMN "variant" SET DEFAULT 'video';
  ALTER TABLE "content_shelves" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_content_shelves_v" ALTER COLUMN "version_variant" SET DEFAULT 'video';
  ALTER TABLE "_content_shelves_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "testimonials" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_testimonials_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "popups" ALTER COLUMN "_status" SET DEFAULT 'draft';
  ALTER TABLE "_popups_v" ALTER COLUMN "version__status" SET DEFAULT 'draft';
  ALTER TABLE "reviews" ALTER COLUMN "status" SET DEFAULT 'awaitingReview';
  ALTER TABLE "forms_emails_locales" ALTER COLUMN "subject" SET DEFAULT 'You''''ve received a new message.';
  ALTER TABLE "forms" ALTER COLUMN "confirmation_type" SET DEFAULT 'message';
  ALTER TABLE "site_navigation_items_columns_items" ALTER COLUMN "open_in_new_window" SET DEFAULT false;
  ALTER TABLE "site_navigation_items" ALTER COLUMN "open_in_new_window" SET DEFAULT false;
  ALTER TABLE "announcement" ALTER COLUMN "show" SET DEFAULT false;
  ALTER TABLE "gift_video_settings" ALTER COLUMN "max_monthly_links" SET DEFAULT 5;
  ALTER TABLE "gift_video_settings" ALTER COLUMN "max_link_views" SET DEFAULT 10;
  ALTER TABLE "videos" ADD COLUMN "featured_image_id" integer;
  ALTER TABLE "videos" ADD COLUMN "tv_hero_image_id" integer;
  ALTER TABLE "videos" ADD COLUMN "interviewee_image_id" integer;
  ALTER TABLE "videos" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "videos" ADD COLUMN "category_id" integer;
  ALTER TABLE "videos" ADD COLUMN "behind_the_scenes_video_id" integer;
  ALTER TABLE "videos" ADD COLUMN "author_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_featured_image_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_tv_hero_image_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_interviewee_image_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_category_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_behind_the_scenes_video_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_author_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_videos_v" ADD COLUMN "published_locale" "enum__videos_v_published_locale";
  ALTER TABLE "pages_blocks_cf_video" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "pages_blocks_videos_grid_videos" ADD COLUMN "video_id_id" integer;
  ALTER TABLE "pages_blocks_form" ADD COLUMN "form_id" integer;
  ALTER TABLE "pages_blocks_media" ADD COLUMN "media_id" integer;
  ALTER TABLE "pages_blocks_items_grid_item" ADD COLUMN "image_id" integer;
  ALTER TABLE "pages_blocks_slides_grid_slides" ADD COLUMN "featured_image_id" integer;
  ALTER TABLE "pages_blocks_slides_grid_slides" ADD COLUMN "mobile_featured_image_id" integer;
  ALTER TABLE "pages_blocks_slides_grid_slides" ADD COLUMN "video_id" integer;
  ALTER TABLE "pages_blocks_hero_banner_block" ADD COLUMN "logo_id" integer;
  ALTER TABLE "pages_blocks_hero_banner_block" ADD COLUMN "trailer_id" integer;
  ALTER TABLE "pages_blocks_hero_banner_block" ADD COLUMN "video_id" integer;
  ALTER TABLE "pages_blocks_hero_banner_block" ADD COLUMN "bg_image_desktop_id" integer;
  ALTER TABLE "pages_blocks_hero_banner_block" ADD COLUMN "bg_image_mobile_id" integer;
  ALTER TABLE "pages_blocks_tvapps" ADD COLUMN "cta_image_id" integer;
  ALTER TABLE "pages_blocks_content_shelf" ADD COLUMN "content_shelf_id" integer;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "image_id" integer;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "mobile_image_id" integer;
  ALTER TABLE "pages_blocks_trailer" ADD COLUMN "video_id_id" integer;
  ALTER TABLE "pages_blocks_trailer" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "pages" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "pages" ADD COLUMN "author_id" integer;
  ALTER TABLE "_pages_v_blocks_cf_video" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "_pages_v_blocks_videos_grid_videos" ADD COLUMN "video_id_id" integer;
  ALTER TABLE "_pages_v_blocks_form" ADD COLUMN "form_id" integer;
  ALTER TABLE "_pages_v_blocks_media" ADD COLUMN "media_id" integer;
  ALTER TABLE "_pages_v_blocks_items_grid_item" ADD COLUMN "image_id" integer;
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" ADD COLUMN "featured_image_id" integer;
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" ADD COLUMN "mobile_featured_image_id" integer;
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" ADD COLUMN "video_id" integer;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD COLUMN "trailer_id" integer;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD COLUMN "video_id" integer;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD COLUMN "bg_image_desktop_id" integer;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD COLUMN "bg_image_mobile_id" integer;
  ALTER TABLE "_pages_v_blocks_tvapps" ADD COLUMN "cta_image_id" integer;
  ALTER TABLE "_pages_v_blocks_content_shelf" ADD COLUMN "content_shelf_id" integer;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "image_id" integer;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "mobile_image_id" integer;
  ALTER TABLE "_pages_v_blocks_trailer" ADD COLUMN "video_id_id" integer;
  ALTER TABLE "_pages_v_blocks_trailer" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_author_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_pages_v" ADD COLUMN "published_locale" "enum__pages_v_published_locale";
  ALTER TABLE "categories" ADD COLUMN "featured_image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "logo_image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "background_image_id" integer;
  ALTER TABLE "categories" ADD COLUMN "banner_image_nav_id" integer;
  ALTER TABLE "categories" ADD COLUMN "banner_image_desktop_id" integer;
  ALTER TABLE "categories" ADD COLUMN "banner_image_mobile_id" integer;
  ALTER TABLE "categories" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_featured_image_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_logo_image_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_background_image_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_banner_image_nav_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_banner_image_desktop_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_banner_image_mobile_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_categories_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_categories_v" ADD COLUMN "published_locale" "enum__categories_v_published_locale";
  ALTER TABLE "morning_notes_sections_cards" ADD COLUMN "image_id" integer;
  ALTER TABLE "morning_notes_blocks_cf_video" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "morning_notes_blocks_videos_grid_videos" ADD COLUMN "video_id_id" integer;
  ALTER TABLE "morning_notes_blocks_form" ADD COLUMN "form_id" integer;
  ALTER TABLE "morning_notes_blocks_media" ADD COLUMN "media_id" integer;
  ALTER TABLE "morning_notes_blocks_items_grid_item" ADD COLUMN "image_id" integer;
  ALTER TABLE "morning_notes" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "morning_notes" ADD COLUMN "author_id" integer;
  ALTER TABLE "_morning_notes_v_version_sections_cards" ADD COLUMN "image_id" integer;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid_videos" ADD COLUMN "video_id_id" integer;
  ALTER TABLE "_morning_notes_v_blocks_form" ADD COLUMN "form_id" integer;
  ALTER TABLE "_morning_notes_v_blocks_media" ADD COLUMN "media_id" integer;
  ALTER TABLE "_morning_notes_v_blocks_items_grid_item" ADD COLUMN "image_id" integer;
  ALTER TABLE "_morning_notes_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_morning_notes_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_morning_notes_v" ADD COLUMN "version_author_id" integer;
  ALTER TABLE "_morning_notes_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_morning_notes_v" ADD COLUMN "published_locale" "enum__morning_notes_v_published_locale";
  ALTER TABLE "media" ADD COLUMN "thumbnail_u_r_l" varchar;
  ALTER TABLE "tvapps" ADD COLUMN "image_id" integer;
  ALTER TABLE "tvapps" ADD COLUMN "image_darkmode_id" integer;
  ALTER TABLE "_tvapps_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_tvapps_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "_tvapps_v" ADD COLUMN "version_image_darkmode_id" integer;
  ALTER TABLE "_tvapps_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_tvapps_v" ADD COLUMN "published_locale" "enum__tvapps_v_published_locale";
  ALTER TABLE "content_shelves_videos" ADD COLUMN "video_id" integer;
  ALTER TABLE "content_shelves_morning_notes" ADD COLUMN "morning_note_id" integer;
  ALTER TABLE "_content_shelves_v_version_videos" ADD COLUMN "video_id" integer;
  ALTER TABLE "_content_shelves_v_version_morning_notes" ADD COLUMN "morning_note_id" integer;
  ALTER TABLE "_content_shelves_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_content_shelves_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_content_shelves_v" ADD COLUMN "published_locale" "enum__content_shelves_v_published_locale";
  ALTER TABLE "_testimonials_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_testimonials_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_testimonials_v" ADD COLUMN "published_locale" "enum__testimonials_v_published_locale";
  ALTER TABLE "_popups_v" ADD COLUMN "parent_id" integer;
  ALTER TABLE "_popups_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_popups_v" ADD COLUMN "published_locale" "enum__popups_v_published_locale";
  ALTER TABLE "forms_blocks_select" ADD COLUMN "placeholder" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN "form_id" integer NOT NULL;
  ALTER TABLE "site_navigation_items_columns_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "mobile_hero_banner_slider" ADD COLUMN "video_id" integer NOT NULL;
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_morning_notes_fk" FOREIGN KEY ("morning_notes_id") REFERENCES "public"."morning_notes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tvapps_fk" FOREIGN KEY ("tvapps_id") REFERENCES "public"."tvapps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_shelves_fk" FOREIGN KEY ("content_shelves_id") REFERENCES "public"."content_shelves"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_popups_fk" FOREIGN KEY ("popups_id") REFERENCES "public"."popups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workflows_fk" FOREIGN KEY ("workflows_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_submissions_fk" FOREIGN KEY ("form_submissions_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_morning_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("morning_notes_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tvapps_id_idx" ON "payload_locked_documents_rels" USING btree ("tvapps_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_content_shelves_id_idx" ON "payload_locked_documents_rels" USING btree ("content_shelves_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_popups_id_idx" ON "payload_locked_documents_rels" USING btree ("popups_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_workflows_id_idx" ON "payload_locked_documents_rels" USING btree ("workflows_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_form_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("form_submissions_id");
  DO $$ BEGIN
   ALTER TABLE "videos" ADD CONSTRAINT "videos_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos" ADD CONSTRAINT "videos_tv_hero_image_id_media_id_fk" FOREIGN KEY ("tv_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos" ADD CONSTRAINT "videos_interviewee_image_id_media_id_fk" FOREIGN KEY ("interviewee_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos" ADD CONSTRAINT "videos_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos" ADD CONSTRAINT "videos_behind_the_scenes_video_id_videos_id_fk" FOREIGN KEY ("behind_the_scenes_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos" ADD CONSTRAINT "videos_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_parent_id_videos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_tv_hero_image_id_media_id_fk" FOREIGN KEY ("version_tv_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_interviewee_image_id_media_id_fk" FOREIGN KEY ("version_interviewee_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_behind_the_scenes_video_id_videos_id_fk" FOREIGN KEY ("version_behind_the_scenes_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_cf_video" ADD CONSTRAINT "pages_blocks_cf_video_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_videos_grid_videos" ADD CONSTRAINT "pages_blocks_videos_grid_videos_video_id_id_videos_id_fk" FOREIGN KEY ("video_id_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_form" ADD CONSTRAINT "pages_blocks_form_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_items_grid_item" ADD CONSTRAINT "pages_blocks_items_grid_item_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_slides_grid_slides" ADD CONSTRAINT "pages_blocks_slides_grid_slides_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_slides_grid_slides" ADD CONSTRAINT "pages_blocks_slides_grid_slides_mobile_featured_image_id_media_id_fk" FOREIGN KEY ("mobile_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_slides_grid_slides" ADD CONSTRAINT "pages_blocks_slides_grid_slides_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_hero_banner_block" ADD CONSTRAINT "pages_blocks_hero_banner_block_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_hero_banner_block" ADD CONSTRAINT "pages_blocks_hero_banner_block_trailer_id_videos_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_hero_banner_block" ADD CONSTRAINT "pages_blocks_hero_banner_block_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_hero_banner_block" ADD CONSTRAINT "pages_blocks_hero_banner_block_bg_image_desktop_id_media_id_fk" FOREIGN KEY ("bg_image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_hero_banner_block" ADD CONSTRAINT "pages_blocks_hero_banner_block_bg_image_mobile_id_media_id_fk" FOREIGN KEY ("bg_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_tvapps" ADD CONSTRAINT "pages_blocks_tvapps_cta_image_id_media_id_fk" FOREIGN KEY ("cta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_content_shelf" ADD CONSTRAINT "pages_blocks_content_shelf_content_shelf_id_content_shelves_id_fk" FOREIGN KEY ("content_shelf_id") REFERENCES "public"."content_shelves"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_trailer" ADD CONSTRAINT "pages_blocks_trailer_video_id_id_videos_id_fk" FOREIGN KEY ("video_id_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_trailer" ADD CONSTRAINT "pages_blocks_trailer_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages" ADD CONSTRAINT "pages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_cf_video" ADD CONSTRAINT "_pages_v_blocks_cf_video_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_videos_grid_videos" ADD CONSTRAINT "_pages_v_blocks_videos_grid_videos_video_id_id_videos_id_fk" FOREIGN KEY ("video_id_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_form" ADD CONSTRAINT "_pages_v_blocks_form_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_items_grid_item" ADD CONSTRAINT "_pages_v_blocks_items_grid_item_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_slides_grid_slides" ADD CONSTRAINT "_pages_v_blocks_slides_grid_slides_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_slides_grid_slides" ADD CONSTRAINT "_pages_v_blocks_slides_grid_slides_mobile_featured_image_id_media_id_fk" FOREIGN KEY ("mobile_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_slides_grid_slides" ADD CONSTRAINT "_pages_v_blocks_slides_grid_slides_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD CONSTRAINT "_pages_v_blocks_hero_banner_block_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD CONSTRAINT "_pages_v_blocks_hero_banner_block_trailer_id_videos_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD CONSTRAINT "_pages_v_blocks_hero_banner_block_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD CONSTRAINT "_pages_v_blocks_hero_banner_block_bg_image_desktop_id_media_id_fk" FOREIGN KEY ("bg_image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_hero_banner_block" ADD CONSTRAINT "_pages_v_blocks_hero_banner_block_bg_image_mobile_id_media_id_fk" FOREIGN KEY ("bg_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_tvapps" ADD CONSTRAINT "_pages_v_blocks_tvapps_cta_image_id_media_id_fk" FOREIGN KEY ("cta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_content_shelf" ADD CONSTRAINT "_pages_v_blocks_content_shelf_content_shelf_id_content_shelves_id_fk" FOREIGN KEY ("content_shelf_id") REFERENCES "public"."content_shelves"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_trailer" ADD CONSTRAINT "_pages_v_blocks_trailer_video_id_id_videos_id_fk" FOREIGN KEY ("video_id_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_trailer" ADD CONSTRAINT "_pages_v_blocks_trailer_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_logo_image_id_media_id_fk" FOREIGN KEY ("logo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_banner_image_nav_id_media_id_fk" FOREIGN KEY ("banner_image_nav_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_banner_image_desktop_id_media_id_fk" FOREIGN KEY ("banner_image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_banner_image_mobile_id_media_id_fk" FOREIGN KEY ("banner_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_logo_image_id_media_id_fk" FOREIGN KEY ("version_logo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_background_image_id_media_id_fk" FOREIGN KEY ("version_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_banner_image_nav_id_media_id_fk" FOREIGN KEY ("version_banner_image_nav_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_banner_image_desktop_id_media_id_fk" FOREIGN KEY ("version_banner_image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_banner_image_mobile_id_media_id_fk" FOREIGN KEY ("version_banner_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v" ADD CONSTRAINT "_categories_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_sections_cards" ADD CONSTRAINT "morning_notes_sections_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_blocks_cf_video" ADD CONSTRAINT "morning_notes_blocks_cf_video_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_blocks_videos_grid_videos" ADD CONSTRAINT "morning_notes_blocks_videos_grid_videos_video_id_id_videos_id_fk" FOREIGN KEY ("video_id_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_blocks_form" ADD CONSTRAINT "morning_notes_blocks_form_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_blocks_media" ADD CONSTRAINT "morning_notes_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_blocks_items_grid_item" ADD CONSTRAINT "morning_notes_blocks_items_grid_item_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes" ADD CONSTRAINT "morning_notes_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes" ADD CONSTRAINT "morning_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_version_sections_cards" ADD CONSTRAINT "_morning_notes_v_version_sections_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_blocks_cf_video" ADD CONSTRAINT "_morning_notes_v_blocks_cf_video_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_blocks_videos_grid_videos" ADD CONSTRAINT "_morning_notes_v_blocks_videos_grid_videos_video_id_id_videos_id_fk" FOREIGN KEY ("video_id_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_blocks_form" ADD CONSTRAINT "_morning_notes_v_blocks_form_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_blocks_media" ADD CONSTRAINT "_morning_notes_v_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_blocks_items_grid_item" ADD CONSTRAINT "_morning_notes_v_blocks_items_grid_item_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v" ADD CONSTRAINT "_morning_notes_v_parent_id_morning_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."morning_notes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v" ADD CONSTRAINT "_morning_notes_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v" ADD CONSTRAINT "_morning_notes_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "tvapps" ADD CONSTRAINT "tvapps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "tvapps" ADD CONSTRAINT "tvapps_image_darkmode_id_media_id_fk" FOREIGN KEY ("image_darkmode_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_tvapps_v" ADD CONSTRAINT "_tvapps_v_parent_id_tvapps_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tvapps"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_tvapps_v" ADD CONSTRAINT "_tvapps_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_tvapps_v" ADD CONSTRAINT "_tvapps_v_version_image_darkmode_id_media_id_fk" FOREIGN KEY ("version_image_darkmode_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "content_shelves_videos" ADD CONSTRAINT "content_shelves_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "content_shelves_morning_notes" ADD CONSTRAINT "content_shelves_morning_notes_morning_note_id_morning_notes_id_fk" FOREIGN KEY ("morning_note_id") REFERENCES "public"."morning_notes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_content_shelves_v_version_videos" ADD CONSTRAINT "_content_shelves_v_version_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_content_shelves_v_version_morning_notes" ADD CONSTRAINT "_content_shelves_v_version_morning_notes_morning_note_id_morning_notes_id_fk" FOREIGN KEY ("morning_note_id") REFERENCES "public"."morning_notes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_content_shelves_v" ADD CONSTRAINT "_content_shelves_v_parent_id_content_shelves_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."content_shelves"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_parent_id_testimonials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_popups_v" ADD CONSTRAINT "_popups_v_parent_id_popups_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."popups"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "site_navigation_items_columns_items" ADD CONSTRAINT "site_navigation_items_columns_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "mobile_hero_banner_slider" ADD CONSTRAINT "mobile_hero_banner_slider_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE UNIQUE INDEX IF NOT EXISTS "videos_timestamps_locales_locale_parent_id_unique" ON "videos_timestamps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "videos_featured_image_idx" ON "videos" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "videos_tv_hero_image_idx" ON "videos" USING btree ("tv_hero_image_id");
  CREATE INDEX IF NOT EXISTS "videos_interviewee_interviewee_image_idx" ON "videos" USING btree ("interviewee_image_id");
  CREATE INDEX IF NOT EXISTS "videos_meta_meta_image_idx" ON "videos" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "videos_category_idx" ON "videos" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "videos_behind_the_scenes_video_idx" ON "videos" USING btree ("behind_the_scenes_video_id");
  CREATE INDEX IF NOT EXISTS "videos_author_idx" ON "videos" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "videos_locales_locale_parent_id_unique" ON "videos_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_videos_v_version_timestamps_locales_locale_parent_id_unique" ON "_videos_v_version_timestamps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_parent_idx" ON "_videos_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_featured_image_idx" ON "_videos_v" USING btree ("version_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_tv_hero_image_idx" ON "_videos_v" USING btree ("version_tv_hero_image_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_interviewee_version_interviewee_image_idx" ON "_videos_v" USING btree ("version_interviewee_image_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_meta_version_meta_image_idx" ON "_videos_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_category_idx" ON "_videos_v" USING btree ("version_category_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_behind_the_scenes_video_idx" ON "_videos_v" USING btree ("version_behind_the_scenes_video_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_author_idx" ON "_videos_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_updated_at_idx" ON "_videos_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_videos_v_snapshot_idx" ON "_videos_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_videos_v_published_locale_idx" ON "_videos_v" USING btree ("published_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_videos_v_locales_locale_parent_id_unique" ON "_videos_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cf_video_cover_image_idx" ON "pages_blocks_cf_video" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_videos_grid_videos_video_id_idx" ON "pages_blocks_videos_grid_videos" USING btree ("video_id_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_form_form_idx" ON "pages_blocks_form" USING btree ("form_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_media_media_idx" ON "pages_blocks_media" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_items_grid_item_image_idx" ON "pages_blocks_items_grid_item" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_slides_grid_slides_featured_image_idx" ON "pages_blocks_slides_grid_slides" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_slides_grid_slides_mobile_featured_image_idx" ON "pages_blocks_slides_grid_slides" USING btree ("mobile_featured_image_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_slides_grid_slides_video_idx" ON "pages_blocks_slides_grid_slides" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_banner_block_logo_idx" ON "pages_blocks_hero_banner_block" USING btree ("logo_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_banner_block_trailer_idx" ON "pages_blocks_hero_banner_block" USING btree ("trailer_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_banner_block_video_idx" ON "pages_blocks_hero_banner_block" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_banner_block_bg_image_desktop_idx" ON "pages_blocks_hero_banner_block" USING btree ("bg_image_desktop_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_hero_banner_block_bg_image_mobile_idx" ON "pages_blocks_hero_banner_block" USING btree ("bg_image_mobile_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_tvapps_cta_image_idx" ON "pages_blocks_tvapps" USING btree ("cta_image_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_shelf_content_shelf_idx" ON "pages_blocks_content_shelf" USING btree ("content_shelf_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cta_image_idx" ON "pages_blocks_cta" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_cta_mobile_image_idx" ON "pages_blocks_cta" USING btree ("mobile_image_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_trailer_video_id_idx" ON "pages_blocks_trailer" USING btree ("video_id_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_trailer_thumbnail_idx" ON "pages_blocks_trailer" USING btree ("thumbnail_id");
  CREATE INDEX IF NOT EXISTS "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "pages_author_idx" ON "pages" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cf_video_cover_image_idx" ON "_pages_v_blocks_cf_video" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_videos_grid_videos_video_id_idx" ON "_pages_v_blocks_videos_grid_videos" USING btree ("video_id_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_form_form_idx" ON "_pages_v_blocks_form" USING btree ("form_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_media_media_idx" ON "_pages_v_blocks_media" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_items_grid_item_image_idx" ON "_pages_v_blocks_items_grid_item" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_slides_grid_slides_featured_image_idx" ON "_pages_v_blocks_slides_grid_slides" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_slides_grid_slides_mobile_featured_image_idx" ON "_pages_v_blocks_slides_grid_slides" USING btree ("mobile_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_slides_grid_slides_video_idx" ON "_pages_v_blocks_slides_grid_slides" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_banner_block_logo_idx" ON "_pages_v_blocks_hero_banner_block" USING btree ("logo_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_banner_block_trailer_idx" ON "_pages_v_blocks_hero_banner_block" USING btree ("trailer_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_banner_block_video_idx" ON "_pages_v_blocks_hero_banner_block" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_banner_block_bg_image_desktop_idx" ON "_pages_v_blocks_hero_banner_block" USING btree ("bg_image_desktop_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_hero_banner_block_bg_image_mobile_idx" ON "_pages_v_blocks_hero_banner_block" USING btree ("bg_image_mobile_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_tvapps_cta_image_idx" ON "_pages_v_blocks_tvapps" USING btree ("cta_image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_content_shelf_content_shelf_idx" ON "_pages_v_blocks_content_shelf" USING btree ("content_shelf_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cta_image_idx" ON "_pages_v_blocks_cta" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_cta_mobile_image_idx" ON "_pages_v_blocks_cta" USING btree ("mobile_image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_trailer_video_id_idx" ON "_pages_v_blocks_trailer" USING btree ("video_id_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_trailer_thumbnail_idx" ON "_pages_v_blocks_trailer" USING btree ("thumbnail_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_author_idx" ON "_pages_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "categories_featured_image_idx" ON "categories" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "categories_logo_image_idx" ON "categories" USING btree ("logo_image_id");
  CREATE INDEX IF NOT EXISTS "categories_background_image_idx" ON "categories" USING btree ("background_image_id");
  CREATE INDEX IF NOT EXISTS "categories_banner_image_nav_idx" ON "categories" USING btree ("banner_image_nav_id");
  CREATE INDEX IF NOT EXISTS "categories_banner_image_desktop_idx" ON "categories" USING btree ("banner_image_desktop_id");
  CREATE INDEX IF NOT EXISTS "categories_banner_image_mobile_idx" ON "categories" USING btree ("banner_image_mobile_id");
  CREATE INDEX IF NOT EXISTS "categories_meta_meta_image_idx" ON "categories" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_categories_v_parent_idx" ON "_categories_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_version_featured_image_idx" ON "_categories_v" USING btree ("version_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_version_logo_image_idx" ON "_categories_v" USING btree ("version_logo_image_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_version_background_image_idx" ON "_categories_v" USING btree ("version_background_image_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_version_banner_image_nav_idx" ON "_categories_v" USING btree ("version_banner_image_nav_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_version_banner_image_desktop_idx" ON "_categories_v" USING btree ("version_banner_image_desktop_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_version_banner_image_mobile_idx" ON "_categories_v" USING btree ("version_banner_image_mobile_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_meta_version_meta_image_idx" ON "_categories_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_version_version_updated_at_idx" ON "_categories_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_categories_v_snapshot_idx" ON "_categories_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_categories_v_published_locale_idx" ON "_categories_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "morning_notes_sections_cards_image_idx" ON "morning_notes_sections_cards" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_blocks_cf_video_cover_image_idx" ON "morning_notes_blocks_cf_video" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_blocks_videos_grid_videos_video_id_idx" ON "morning_notes_blocks_videos_grid_videos" USING btree ("video_id_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_blocks_form_form_idx" ON "morning_notes_blocks_form" USING btree ("form_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_blocks_media_media_idx" ON "morning_notes_blocks_media" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_blocks_items_grid_item_image_idx" ON "morning_notes_blocks_items_grid_item" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_meta_meta_image_idx" ON "morning_notes" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_author_idx" ON "morning_notes" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_updated_at_idx" ON "morning_notes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_version_sections_cards_image_idx" ON "_morning_notes_v_version_sections_cards" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_blocks_cf_video_cover_image_idx" ON "_morning_notes_v_blocks_cf_video" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_blocks_videos_grid_videos_video_id_idx" ON "_morning_notes_v_blocks_videos_grid_videos" USING btree ("video_id_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_blocks_form_form_idx" ON "_morning_notes_v_blocks_form" USING btree ("form_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_blocks_media_media_idx" ON "_morning_notes_v_blocks_media" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_blocks_items_grid_item_image_idx" ON "_morning_notes_v_blocks_items_grid_item" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_parent_idx" ON "_morning_notes_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_version_meta_version_meta_image_idx" ON "_morning_notes_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_version_version_author_idx" ON "_morning_notes_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_version_version_updated_at_idx" ON "_morning_notes_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_snapshot_idx" ON "_morning_notes_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_published_locale_idx" ON "_morning_notes_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tvapps_image_idx" ON "tvapps" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "tvapps_image_darkmode_idx" ON "tvapps" USING btree ("image_darkmode_id");
  CREATE INDEX IF NOT EXISTS "tvapps_updated_at_idx" ON "tvapps" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_parent_idx" ON "_tvapps_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_version_version_image_idx" ON "_tvapps_v" USING btree ("version_image_id");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_version_version_image_darkmode_idx" ON "_tvapps_v" USING btree ("version_image_darkmode_id");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_version_version_updated_at_idx" ON "_tvapps_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_snapshot_idx" ON "_tvapps_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_published_locale_idx" ON "_tvapps_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "content_shelves_videos_video_idx" ON "content_shelves_videos" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "content_shelves_morning_notes_morning_note_idx" ON "content_shelves_morning_notes" USING btree ("morning_note_id");
  CREATE INDEX IF NOT EXISTS "content_shelves_updated_at_idx" ON "content_shelves" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_version_videos_video_idx" ON "_content_shelves_v_version_videos" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_version_morning_notes_morning_note_idx" ON "_content_shelves_v_version_morning_notes" USING btree ("morning_note_id");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_parent_idx" ON "_content_shelves_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_version_version_updated_at_idx" ON "_content_shelves_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_snapshot_idx" ON "_content_shelves_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_published_locale_idx" ON "_content_shelves_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_parent_idx" ON "_testimonials_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_version_version_updated_at_idx" ON "_testimonials_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_snapshot_idx" ON "_testimonials_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_published_locale_idx" ON "_testimonials_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "popups_updated_at_idx" ON "popups" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_popups_v_parent_idx" ON "_popups_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_popups_v_version_version_updated_at_idx" ON "_popups_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_popups_v_snapshot_idx" ON "_popups_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_popups_v_published_locale_idx" ON "_popups_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "workflows_updated_at_idx" ON "workflows" USING btree ("updated_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_checkbox_locales_locale_parent_id_unique" ON "forms_blocks_checkbox_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_country_locales_locale_parent_id_unique" ON "forms_blocks_country_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_email_locales_locale_parent_id_unique" ON "forms_blocks_email_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_message_locales_locale_parent_id_unique" ON "forms_blocks_message_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_number_locales_locale_parent_id_unique" ON "forms_blocks_number_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_select_options_locales_locale_parent_id_unique" ON "forms_blocks_select_options_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_select_locales_locale_parent_id_unique" ON "forms_blocks_select_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_state_locales_locale_parent_id_unique" ON "forms_blocks_state_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_text_locales_locale_parent_id_unique" ON "forms_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_textarea_locales_locale_parent_id_unique" ON "forms_blocks_textarea_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_date_locales_locale_parent_id_unique" ON "forms_blocks_date_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_emails_locales_locale_parent_id_unique" ON "forms_emails_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_updated_at_idx" ON "forms" USING btree ("updated_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_locales_locale_parent_id_unique" ON "forms_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "form_submissions_form_idx" ON "form_submissions" USING btree ("form_id");
  CREATE INDEX IF NOT EXISTS "form_submissions_updated_at_idx" ON "form_submissions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "site_navigation_items_columns_items_image_idx" ON "site_navigation_items_columns_items" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "mobile_hero_banner_slider_video_idx" ON "mobile_hero_banner_slider" USING btree ("video_id");
  CREATE INDEX IF NOT EXISTS "videos_title_idx" ON "videos_locales" USING btree ("title","_locale");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_title_idx" ON "_videos_v_locales" USING btree ("version_title","_locale");
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "media_id";
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "videos_id";
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "forms_id";
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "content_shelves_id";
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "users_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "pages_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "media_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "videos_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "forms_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "content_shelves_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "users_id";\`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql\`
   CREATE TABLE IF NOT EXISTS "videos_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"media_id" integer,
  \t"categories_id" integer,
  \t"videos_id" integer,
  \t"users_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_videos_v_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"videos_id" integer,
  \t"media_id" integer,
  \t"categories_id" integer,
  \t"users_id" integer
  );

  CREATE TABLE IF NOT EXISTS "categories_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"media_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_categories_v_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"categories_id" integer,
  \t"media_id" integer
  );

  CREATE TABLE IF NOT EXISTS "morning_notes_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"media_id" integer,
  \t"videos_id" integer,
  \t"forms_id" integer,
  \t"users_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_morning_notes_v_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"morning_notes_id" integer,
  \t"media_id" integer,
  \t"videos_id" integer,
  \t"forms_id" integer,
  \t"users_id" integer
  );

  CREATE TABLE IF NOT EXISTS "tvapps_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"media_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_tvapps_v_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"tvapps_id" integer,
  \t"media_id" integer
  );

  CREATE TABLE IF NOT EXISTS "content_shelves_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"videos_id" integer,
  \t"morning_notes_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_content_shelves_v_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"content_shelves_id" integer,
  \t"videos_id" integer,
  \t"morning_notes_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_testimonials_v_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"testimonials_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_popups_v_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"popups_id" integer
  );

  CREATE TABLE IF NOT EXISTS "form_submissions_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"forms_id" integer
  );

  CREATE TABLE IF NOT EXISTS "site_navigation_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"media_id" integer
  );

  CREATE TABLE IF NOT EXISTS "mobile_hero_banner_rels" (
  \t"id" serial PRIMARY KEY NOT NULL,
  \t"order" integer,
  \t"parent_id" integer NOT NULL,
  \t"path" varchar NOT NULL,
  \t"videos_id" integer
  );

  ALTER TABLE "payload_locked_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  ALTER TABLE "videos" DROP CONSTRAINT "videos_featured_image_id_media_id_fk";

  ALTER TABLE "videos" DROP CONSTRAINT "videos_tv_hero_image_id_media_id_fk";

  ALTER TABLE "videos" DROP CONSTRAINT "videos_interviewee_image_id_media_id_fk";

  ALTER TABLE "videos" DROP CONSTRAINT "videos_meta_image_id_media_id_fk";

  ALTER TABLE "videos" DROP CONSTRAINT "videos_category_id_categories_id_fk";

  ALTER TABLE "videos" DROP CONSTRAINT "videos_behind_the_scenes_video_id_videos_id_fk";

  ALTER TABLE "videos" DROP CONSTRAINT "videos_author_id_users_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_parent_id_videos_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_featured_image_id_media_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_tv_hero_image_id_media_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_interviewee_image_id_media_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_meta_image_id_media_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_category_id_categories_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_behind_the_scenes_video_id_videos_id_fk";

  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_author_id_users_id_fk";

  ALTER TABLE "pages_blocks_cf_video" DROP CONSTRAINT "pages_blocks_cf_video_cover_image_id_media_id_fk";

  ALTER TABLE "pages_blocks_videos_grid_videos" DROP CONSTRAINT "pages_blocks_videos_grid_videos_video_id_id_videos_id_fk";

  ALTER TABLE "pages_blocks_form" DROP CONSTRAINT "pages_blocks_form_form_id_forms_id_fk";

  ALTER TABLE "pages_blocks_media" DROP CONSTRAINT "pages_blocks_media_media_id_media_id_fk";

  ALTER TABLE "pages_blocks_items_grid_item" DROP CONSTRAINT "pages_blocks_items_grid_item_image_id_media_id_fk";

  ALTER TABLE "pages_blocks_slides_grid_slides" DROP CONSTRAINT "pages_blocks_slides_grid_slides_featured_image_id_media_id_fk";

  ALTER TABLE "pages_blocks_slides_grid_slides" DROP CONSTRAINT "pages_blocks_slides_grid_slides_mobile_featured_image_id_media_id_fk";

  ALTER TABLE "pages_blocks_slides_grid_slides" DROP CONSTRAINT "pages_blocks_slides_grid_slides_video_id_videos_id_fk";

  ALTER TABLE "pages_blocks_hero_banner_block" DROP CONSTRAINT "pages_blocks_hero_banner_block_logo_id_media_id_fk";

  ALTER TABLE "pages_blocks_hero_banner_block" DROP CONSTRAINT "pages_blocks_hero_banner_block_trailer_id_videos_id_fk";

  ALTER TABLE "pages_blocks_hero_banner_block" DROP CONSTRAINT "pages_blocks_hero_banner_block_video_id_videos_id_fk";

  ALTER TABLE "pages_blocks_hero_banner_block" DROP CONSTRAINT "pages_blocks_hero_banner_block_bg_image_desktop_id_media_id_fk";

  ALTER TABLE "pages_blocks_hero_banner_block" DROP CONSTRAINT "pages_blocks_hero_banner_block_bg_image_mobile_id_media_id_fk";

  ALTER TABLE "pages_blocks_tvapps" DROP CONSTRAINT "pages_blocks_tvapps_cta_image_id_media_id_fk";

  ALTER TABLE "pages_blocks_content_shelf" DROP CONSTRAINT "pages_blocks_content_shelf_content_shelf_id_content_shelves_id_fk";

  ALTER TABLE "pages_blocks_cta" DROP CONSTRAINT "pages_blocks_cta_image_id_media_id_fk";

  ALTER TABLE "pages_blocks_cta" DROP CONSTRAINT "pages_blocks_cta_mobile_image_id_media_id_fk";

  ALTER TABLE "pages_blocks_trailer" DROP CONSTRAINT "pages_blocks_trailer_video_id_id_videos_id_fk";

  ALTER TABLE "pages_blocks_trailer" DROP CONSTRAINT "pages_blocks_trailer_thumbnail_id_media_id_fk";

  ALTER TABLE "pages" DROP CONSTRAINT "pages_meta_image_id_media_id_fk";

  ALTER TABLE "pages" DROP CONSTRAINT "pages_author_id_users_id_fk";

  ALTER TABLE "_pages_v_blocks_cf_video" DROP CONSTRAINT "_pages_v_blocks_cf_video_cover_image_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_videos_grid_videos" DROP CONSTRAINT "_pages_v_blocks_videos_grid_videos_video_id_id_videos_id_fk";

  ALTER TABLE "_pages_v_blocks_form" DROP CONSTRAINT "_pages_v_blocks_form_form_id_forms_id_fk";

  ALTER TABLE "_pages_v_blocks_media" DROP CONSTRAINT "_pages_v_blocks_media_media_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_items_grid_item" DROP CONSTRAINT "_pages_v_blocks_items_grid_item_image_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_slides_grid_slides" DROP CONSTRAINT "_pages_v_blocks_slides_grid_slides_featured_image_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_slides_grid_slides" DROP CONSTRAINT "_pages_v_blocks_slides_grid_slides_mobile_featured_image_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_slides_grid_slides" DROP CONSTRAINT "_pages_v_blocks_slides_grid_slides_video_id_videos_id_fk";

  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP CONSTRAINT "_pages_v_blocks_hero_banner_block_logo_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP CONSTRAINT "_pages_v_blocks_hero_banner_block_trailer_id_videos_id_fk";

  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP CONSTRAINT "_pages_v_blocks_hero_banner_block_video_id_videos_id_fk";

  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP CONSTRAINT "_pages_v_blocks_hero_banner_block_bg_image_desktop_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP CONSTRAINT "_pages_v_blocks_hero_banner_block_bg_image_mobile_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_tvapps" DROP CONSTRAINT "_pages_v_blocks_tvapps_cta_image_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_content_shelf" DROP CONSTRAINT "_pages_v_blocks_content_shelf_content_shelf_id_content_shelves_id_fk";

  ALTER TABLE "_pages_v_blocks_cta" DROP CONSTRAINT "_pages_v_blocks_cta_image_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_cta" DROP CONSTRAINT "_pages_v_blocks_cta_mobile_image_id_media_id_fk";

  ALTER TABLE "_pages_v_blocks_trailer" DROP CONSTRAINT "_pages_v_blocks_trailer_video_id_id_videos_id_fk";

  ALTER TABLE "_pages_v_blocks_trailer" DROP CONSTRAINT "_pages_v_blocks_trailer_thumbnail_id_media_id_fk";

  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_parent_id_pages_id_fk";

  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk";

  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_author_id_users_id_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_featured_image_id_media_id_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_logo_image_id_media_id_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_background_image_id_media_id_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_banner_image_nav_id_media_id_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_banner_image_desktop_id_media_id_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_banner_image_mobile_id_media_id_fk";

  ALTER TABLE "categories" DROP CONSTRAINT "categories_meta_image_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_parent_id_categories_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_featured_image_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_logo_image_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_background_image_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_banner_image_nav_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_banner_image_desktop_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_banner_image_mobile_id_media_id_fk";

  ALTER TABLE "_categories_v" DROP CONSTRAINT "_categories_v_version_meta_image_id_media_id_fk";

  ALTER TABLE "morning_notes_sections_cards" DROP CONSTRAINT "morning_notes_sections_cards_image_id_media_id_fk";

  ALTER TABLE "morning_notes_blocks_cf_video" DROP CONSTRAINT "morning_notes_blocks_cf_video_cover_image_id_media_id_fk";

  ALTER TABLE "morning_notes_blocks_videos_grid_videos" DROP CONSTRAINT "morning_notes_blocks_videos_grid_videos_video_id_id_videos_id_fk";

  ALTER TABLE "morning_notes_blocks_form" DROP CONSTRAINT "morning_notes_blocks_form_form_id_forms_id_fk";

  ALTER TABLE "morning_notes_blocks_media" DROP CONSTRAINT "morning_notes_blocks_media_media_id_media_id_fk";

  ALTER TABLE "morning_notes_blocks_items_grid_item" DROP CONSTRAINT "morning_notes_blocks_items_grid_item_image_id_media_id_fk";

  ALTER TABLE "morning_notes" DROP CONSTRAINT "morning_notes_meta_image_id_media_id_fk";

  ALTER TABLE "morning_notes" DROP CONSTRAINT "morning_notes_author_id_users_id_fk";

  ALTER TABLE "_morning_notes_v_version_sections_cards" DROP CONSTRAINT "_morning_notes_v_version_sections_cards_image_id_media_id_fk";

  ALTER TABLE "_morning_notes_v_blocks_cf_video" DROP CONSTRAINT "_morning_notes_v_blocks_cf_video_cover_image_id_media_id_fk";

  ALTER TABLE "_morning_notes_v_blocks_videos_grid_videos" DROP CONSTRAINT "_morning_notes_v_blocks_videos_grid_videos_video_id_id_videos_id_fk";

  ALTER TABLE "_morning_notes_v_blocks_form" DROP CONSTRAINT "_morning_notes_v_blocks_form_form_id_forms_id_fk";

  ALTER TABLE "_morning_notes_v_blocks_media" DROP CONSTRAINT "_morning_notes_v_blocks_media_media_id_media_id_fk";

  ALTER TABLE "_morning_notes_v_blocks_items_grid_item" DROP CONSTRAINT "_morning_notes_v_blocks_items_grid_item_image_id_media_id_fk";

  ALTER TABLE "_morning_notes_v" DROP CONSTRAINT "_morning_notes_v_parent_id_morning_notes_id_fk";

  ALTER TABLE "_morning_notes_v" DROP CONSTRAINT "_morning_notes_v_version_meta_image_id_media_id_fk";

  ALTER TABLE "_morning_notes_v" DROP CONSTRAINT "_morning_notes_v_version_author_id_users_id_fk";

  ALTER TABLE "tvapps" DROP CONSTRAINT "tvapps_image_id_media_id_fk";

  ALTER TABLE "tvapps" DROP CONSTRAINT "tvapps_image_darkmode_id_media_id_fk";

  ALTER TABLE "_tvapps_v" DROP CONSTRAINT "_tvapps_v_parent_id_tvapps_id_fk";

  ALTER TABLE "_tvapps_v" DROP CONSTRAINT "_tvapps_v_version_image_id_media_id_fk";

  ALTER TABLE "_tvapps_v" DROP CONSTRAINT "_tvapps_v_version_image_darkmode_id_media_id_fk";

  ALTER TABLE "content_shelves_videos" DROP CONSTRAINT "content_shelves_videos_video_id_videos_id_fk";

  ALTER TABLE "content_shelves_morning_notes" DROP CONSTRAINT "content_shelves_morning_notes_morning_note_id_morning_notes_id_fk";

  ALTER TABLE "_content_shelves_v_version_videos" DROP CONSTRAINT "_content_shelves_v_version_videos_video_id_videos_id_fk";

  ALTER TABLE "_content_shelves_v_version_morning_notes" DROP CONSTRAINT "_content_shelves_v_version_morning_notes_morning_note_id_morning_notes_id_fk";

  ALTER TABLE "_content_shelves_v" DROP CONSTRAINT "_content_shelves_v_parent_id_content_shelves_id_fk";

  ALTER TABLE "_testimonials_v" DROP CONSTRAINT "_testimonials_v_parent_id_testimonials_id_fk";

  ALTER TABLE "_popups_v" DROP CONSTRAINT "_popups_v_parent_id_popups_id_fk";

  ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_form_id_forms_id_fk";

  ALTER TABLE "site_navigation_items_columns_items" DROP CONSTRAINT "site_navigation_items_columns_items_image_id_media_id_fk";

  ALTER TABLE "mobile_hero_banner_slider" DROP CONSTRAINT "mobile_hero_banner_slider_video_id_videos_id_fk";

  DROP INDEX IF EXISTS "videos_timestamps_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "videos_featured_image_idx";
  DROP INDEX IF EXISTS "videos_tv_hero_image_idx";
  DROP INDEX IF EXISTS "videos_interviewee_interviewee_image_idx";
  DROP INDEX IF EXISTS "videos_meta_meta_image_idx";
  DROP INDEX IF EXISTS "videos_category_idx";
  DROP INDEX IF EXISTS "videos_behind_the_scenes_video_idx";
  DROP INDEX IF EXISTS "videos_author_idx";
  DROP INDEX IF EXISTS "videos_updated_at_idx";
  DROP INDEX IF EXISTS "videos_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "_videos_v_version_timestamps_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "_videos_v_parent_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_featured_image_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_tv_hero_image_idx";
  DROP INDEX IF EXISTS "_videos_v_version_interviewee_version_interviewee_image_idx";
  DROP INDEX IF EXISTS "_videos_v_version_meta_version_meta_image_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_category_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_behind_the_scenes_video_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_author_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_videos_v_snapshot_idx";
  DROP INDEX IF EXISTS "_videos_v_published_locale_idx";
  DROP INDEX IF EXISTS "_videos_v_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "pages_blocks_cf_video_cover_image_idx";
  DROP INDEX IF EXISTS "pages_blocks_videos_grid_videos_video_id_idx";
  DROP INDEX IF EXISTS "pages_blocks_form_form_idx";
  DROP INDEX IF EXISTS "pages_blocks_media_media_idx";
  DROP INDEX IF EXISTS "pages_blocks_items_grid_item_image_idx";
  DROP INDEX IF EXISTS "pages_blocks_slides_grid_slides_featured_image_idx";
  DROP INDEX IF EXISTS "pages_blocks_slides_grid_slides_mobile_featured_image_idx";
  DROP INDEX IF EXISTS "pages_blocks_slides_grid_slides_video_idx";
  DROP INDEX IF EXISTS "pages_blocks_hero_banner_block_logo_idx";
  DROP INDEX IF EXISTS "pages_blocks_hero_banner_block_trailer_idx";
  DROP INDEX IF EXISTS "pages_blocks_hero_banner_block_video_idx";
  DROP INDEX IF EXISTS "pages_blocks_hero_banner_block_bg_image_desktop_idx";
  DROP INDEX IF EXISTS "pages_blocks_hero_banner_block_bg_image_mobile_idx";
  DROP INDEX IF EXISTS "pages_blocks_tvapps_cta_image_idx";
  DROP INDEX IF EXISTS "pages_blocks_content_shelf_content_shelf_idx";
  DROP INDEX IF EXISTS "pages_blocks_cta_image_idx";
  DROP INDEX IF EXISTS "pages_blocks_cta_mobile_image_idx";
  DROP INDEX IF EXISTS "pages_blocks_trailer_video_id_idx";
  DROP INDEX IF EXISTS "pages_blocks_trailer_thumbnail_idx";
  DROP INDEX IF EXISTS "pages_meta_meta_image_idx";
  DROP INDEX IF EXISTS "pages_author_idx";
  DROP INDEX IF EXISTS "pages_updated_at_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_cf_video_cover_image_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_videos_grid_videos_video_id_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_form_form_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_media_media_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_items_grid_item_image_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_slides_grid_slides_featured_image_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_slides_grid_slides_mobile_featured_image_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_slides_grid_slides_video_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_hero_banner_block_logo_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_hero_banner_block_trailer_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_hero_banner_block_video_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_hero_banner_block_bg_image_desktop_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_hero_banner_block_bg_image_mobile_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_tvapps_cta_image_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_content_shelf_content_shelf_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_cta_image_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_cta_mobile_image_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_trailer_video_id_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_trailer_thumbnail_idx";
  DROP INDEX IF EXISTS "_pages_v_parent_idx";
  DROP INDEX IF EXISTS "_pages_v_version_meta_version_meta_image_idx";
  DROP INDEX IF EXISTS "_pages_v_version_version_author_idx";
  DROP INDEX IF EXISTS "_pages_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_pages_v_snapshot_idx";
  DROP INDEX IF EXISTS "_pages_v_published_locale_idx";
  DROP INDEX IF EXISTS "categories_featured_image_idx";
  DROP INDEX IF EXISTS "categories_logo_image_idx";
  DROP INDEX IF EXISTS "categories_background_image_idx";
  DROP INDEX IF EXISTS "categories_banner_image_nav_idx";
  DROP INDEX IF EXISTS "categories_banner_image_desktop_idx";
  DROP INDEX IF EXISTS "categories_banner_image_mobile_idx";
  DROP INDEX IF EXISTS "categories_meta_meta_image_idx";
  DROP INDEX IF EXISTS "categories_updated_at_idx";
  DROP INDEX IF EXISTS "_categories_v_parent_idx";
  DROP INDEX IF EXISTS "_categories_v_version_version_featured_image_idx";
  DROP INDEX IF EXISTS "_categories_v_version_version_logo_image_idx";
  DROP INDEX IF EXISTS "_categories_v_version_version_background_image_idx";
  DROP INDEX IF EXISTS "_categories_v_version_version_banner_image_nav_idx";
  DROP INDEX IF EXISTS "_categories_v_version_version_banner_image_desktop_idx";
  DROP INDEX IF EXISTS "_categories_v_version_version_banner_image_mobile_idx";
  DROP INDEX IF EXISTS "_categories_v_version_meta_version_meta_image_idx";
  DROP INDEX IF EXISTS "_categories_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_categories_v_snapshot_idx";
  DROP INDEX IF EXISTS "_categories_v_published_locale_idx";
  DROP INDEX IF EXISTS "media_updated_at_idx";
  DROP INDEX IF EXISTS "morning_notes_sections_cards_image_idx";
  DROP INDEX IF EXISTS "morning_notes_blocks_cf_video_cover_image_idx";
  DROP INDEX IF EXISTS "morning_notes_blocks_videos_grid_videos_video_id_idx";
  DROP INDEX IF EXISTS "morning_notes_blocks_form_form_idx";
  DROP INDEX IF EXISTS "morning_notes_blocks_media_media_idx";
  DROP INDEX IF EXISTS "morning_notes_blocks_items_grid_item_image_idx";
  DROP INDEX IF EXISTS "morning_notes_meta_meta_image_idx";
  DROP INDEX IF EXISTS "morning_notes_author_idx";
  DROP INDEX IF EXISTS "morning_notes_updated_at_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_version_sections_cards_image_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_blocks_cf_video_cover_image_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_blocks_videos_grid_videos_video_id_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_blocks_form_form_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_blocks_media_media_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_blocks_items_grid_item_image_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_parent_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_version_meta_version_meta_image_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_version_version_author_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_snapshot_idx";
  DROP INDEX IF EXISTS "_morning_notes_v_published_locale_idx";
  DROP INDEX IF EXISTS "users_updated_at_idx";
  DROP INDEX IF EXISTS "tvapps_image_idx";
  DROP INDEX IF EXISTS "tvapps_image_darkmode_idx";
  DROP INDEX IF EXISTS "tvapps_updated_at_idx";
  DROP INDEX IF EXISTS "_tvapps_v_parent_idx";
  DROP INDEX IF EXISTS "_tvapps_v_version_version_image_idx";
  DROP INDEX IF EXISTS "_tvapps_v_version_version_image_darkmode_idx";
  DROP INDEX IF EXISTS "_tvapps_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_tvapps_v_snapshot_idx";
  DROP INDEX IF EXISTS "_tvapps_v_published_locale_idx";
  DROP INDEX IF EXISTS "content_shelves_videos_video_idx";
  DROP INDEX IF EXISTS "content_shelves_morning_notes_morning_note_idx";
  DROP INDEX IF EXISTS "content_shelves_updated_at_idx";
  DROP INDEX IF EXISTS "_content_shelves_v_version_videos_video_idx";
  DROP INDEX IF EXISTS "_content_shelves_v_version_morning_notes_morning_note_idx";
  DROP INDEX IF EXISTS "_content_shelves_v_parent_idx";
  DROP INDEX IF EXISTS "_content_shelves_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_content_shelves_v_snapshot_idx";
  DROP INDEX IF EXISTS "_content_shelves_v_published_locale_idx";
  DROP INDEX IF EXISTS "testimonials_updated_at_idx";
  DROP INDEX IF EXISTS "_testimonials_v_parent_idx";
  DROP INDEX IF EXISTS "_testimonials_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_testimonials_v_snapshot_idx";
  DROP INDEX IF EXISTS "_testimonials_v_published_locale_idx";
  DROP INDEX IF EXISTS "popups_updated_at_idx";
  DROP INDEX IF EXISTS "_popups_v_parent_idx";
  DROP INDEX IF EXISTS "_popups_v_version_version_updated_at_idx";
  DROP INDEX IF EXISTS "_popups_v_snapshot_idx";
  DROP INDEX IF EXISTS "_popups_v_published_locale_idx";
  DROP INDEX IF EXISTS "reviews_updated_at_idx";
  DROP INDEX IF EXISTS "workflows_updated_at_idx";
  DROP INDEX IF EXISTS "forms_blocks_checkbox_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_country_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_email_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_message_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_number_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_select_options_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_select_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_state_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_text_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_textarea_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_blocks_date_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_emails_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "forms_updated_at_idx";
  DROP INDEX IF EXISTS "forms_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "form_submissions_form_idx";
  DROP INDEX IF EXISTS "form_submissions_updated_at_idx";
  DROP INDEX IF EXISTS "payload_preferences_updated_at_idx";
  DROP INDEX IF EXISTS "payload_migrations_updated_at_idx";
  DROP INDEX IF EXISTS "site_navigation_items_columns_items_image_idx";
  DROP INDEX IF EXISTS "mobile_hero_banner_slider_video_idx";
  DROP INDEX IF EXISTS "videos_title_idx";
  DROP INDEX IF EXISTS "_videos_v_version_version_title_idx";
  ALTER TABLE "videos" ALTER COLUMN "feature_on_homepage" DROP DEFAULT;
  ALTER TABLE "videos" ALTER COLUMN "must_see" DROP DEFAULT;
  ALTER TABLE "videos" ALTER COLUMN "feature_on_library" DROP DEFAULT;
  ALTER TABLE "videos" ALTER COLUMN "paywall" DROP DEFAULT;
  ALTER TABLE "videos" ALTER COLUMN "gift_video_end" DROP DEFAULT;
  ALTER TABLE "videos" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_feature_on_homepage" DROP DEFAULT;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_must_see" DROP DEFAULT;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_feature_on_library" DROP DEFAULT;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_paywall" DROP DEFAULT;
  ALTER TABLE "_videos_v" ALTER COLUMN "version_gift_video_end" DROP DEFAULT;
  ALTER TABLE "_videos_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "pages_blocks_rich_text" ALTER COLUMN "variant" DROP DEFAULT;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "controls" DROP DEFAULT;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "loop" DROP DEFAULT;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "preload" DROP DEFAULT;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "muted" DROP DEFAULT;
  ALTER TABLE "pages_blocks_cf_video" ALTER COLUMN "lazy" DROP DEFAULT;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_title" DROP DEFAULT;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_description" DROP DEFAULT;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_date" DROP DEFAULT;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_category" DROP DEFAULT;
  ALTER TABLE "pages_blocks_videos_grid" ALTER COLUMN "has_location" DROP DEFAULT;
  ALTER TABLE "pages_blocks_events_list_events" ALTER COLUMN "event_status" DROP DEFAULT;
  ALTER TABLE "pages_blocks_slides_grid_slides" ALTER COLUMN "show_run_time" DROP DEFAULT;
  ALTER TABLE "pages_blocks_slides_grid_slides" ALTER COLUMN "show_button" DROP DEFAULT;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_non_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_non_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "pages_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "pages_blocks_tvapps" ALTER COLUMN "color_scheme" DROP DEFAULT;
  ALTER TABLE "pages_blocks_event_tickets" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "pages_blocks_continue_watching" ALTER COLUMN "videos_limit" DROP DEFAULT;
  ALTER TABLE "pages_blocks_latest_videos" ALTER COLUMN "feature_first_video" DROP DEFAULT;
  ALTER TABLE "pages_blocks_trailer" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "pages" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_rich_text" ALTER COLUMN "variant" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "controls" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "loop" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "preload" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "muted" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_cf_video" ALTER COLUMN "lazy" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_title" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_description" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_date" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_category" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_videos_grid" ALTER COLUMN "has_location" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_events_list_events" ALTER COLUMN "event_status" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" ALTER COLUMN "show_run_time" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" ALTER COLUMN "show_button" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_non_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_pre_release_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_non_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_hero_banner_block" ALTER COLUMN "hero_button_post_release_subscriber_show_play_icon" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_tvapps" ALTER COLUMN "color_scheme" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_event_tickets" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_continue_watching" ALTER COLUMN "videos_limit" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_latest_videos" ALTER COLUMN "feature_first_video" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_trailer" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "_pages_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "categories" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_categories_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_rich_text" ALTER COLUMN "variant" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "controls" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "loop" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "preload" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "muted" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_cf_video" ALTER COLUMN "lazy" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_title" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_description" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_date" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_category" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_videos_grid" ALTER COLUMN "has_location" DROP DEFAULT;
  ALTER TABLE "morning_notes_blocks_events_list_events" ALTER COLUMN "event_status" DROP DEFAULT;
  ALTER TABLE "morning_notes" ALTER COLUMN "paywall" DROP DEFAULT;
  ALTER TABLE "morning_notes" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_rich_text" ALTER COLUMN "variant" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "controls" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "loop" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "preload" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "muted" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_cf_video" ALTER COLUMN "lazy" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "autoplay" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_title" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_description" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_date" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_category" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_videos_grid" ALTER COLUMN "has_location" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v_blocks_events_list_events" ALTER COLUMN "event_status" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v" ALTER COLUMN "version_paywall" DROP DEFAULT;
  ALTER TABLE "_morning_notes_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "tvapps" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_tvapps_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "content_shelves" ALTER COLUMN "variant" DROP DEFAULT;
  ALTER TABLE "content_shelves" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_content_shelves_v" ALTER COLUMN "version_variant" DROP DEFAULT;
  ALTER TABLE "_content_shelves_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "testimonials" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_testimonials_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "popups" ALTER COLUMN "_status" DROP DEFAULT;
  ALTER TABLE "_popups_v" ALTER COLUMN "version__status" DROP DEFAULT;
  ALTER TABLE "reviews" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "forms_emails_locales" ALTER COLUMN "subject" DROP DEFAULT;
  ALTER TABLE "forms" ALTER COLUMN "confirmation_type" DROP DEFAULT;
  ALTER TABLE "announcement" ALTER COLUMN "show" DROP DEFAULT;
  ALTER TABLE "site_navigation_items_columns_items" ALTER COLUMN "open_in_new_window" DROP DEFAULT;
  ALTER TABLE "site_navigation_items" ALTER COLUMN "open_in_new_window" DROP DEFAULT;
  ALTER TABLE "gift_video_settings" ALTER COLUMN "max_monthly_links" DROP DEFAULT;
  ALTER TABLE "gift_video_settings" ALTER COLUMN "max_link_views" DROP DEFAULT;
  ALTER TABLE "pages_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "videos_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "forms_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "content_shelves_id" integer;
  ALTER TABLE "pages_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "videos_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "forms_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "content_shelves_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "users_id" integer;
  DO $$ BEGIN
   ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v_rels" ADD CONSTRAINT "_categories_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_categories_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v_rels" ADD CONSTRAINT "_categories_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_categories_v_rels" ADD CONSTRAINT "_categories_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_rels" ADD CONSTRAINT "morning_notes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."morning_notes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_rels" ADD CONSTRAINT "morning_notes_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_rels" ADD CONSTRAINT "morning_notes_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_rels" ADD CONSTRAINT "morning_notes_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "morning_notes_rels" ADD CONSTRAINT "morning_notes_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_rels" ADD CONSTRAINT "_morning_notes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_morning_notes_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_rels" ADD CONSTRAINT "_morning_notes_v_rels_morning_notes_fk" FOREIGN KEY ("morning_notes_id") REFERENCES "public"."morning_notes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_rels" ADD CONSTRAINT "_morning_notes_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_rels" ADD CONSTRAINT "_morning_notes_v_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_rels" ADD CONSTRAINT "_morning_notes_v_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_morning_notes_v_rels" ADD CONSTRAINT "_morning_notes_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "tvapps_rels" ADD CONSTRAINT "tvapps_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tvapps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "tvapps_rels" ADD CONSTRAINT "tvapps_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_tvapps_v_rels" ADD CONSTRAINT "_tvapps_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_tvapps_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_tvapps_v_rels" ADD CONSTRAINT "_tvapps_v_rels_tvapps_fk" FOREIGN KEY ("tvapps_id") REFERENCES "public"."tvapps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_tvapps_v_rels" ADD CONSTRAINT "_tvapps_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "content_shelves_rels" ADD CONSTRAINT "content_shelves_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."content_shelves"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "content_shelves_rels" ADD CONSTRAINT "content_shelves_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "content_shelves_rels" ADD CONSTRAINT "content_shelves_rels_morning_notes_fk" FOREIGN KEY ("morning_notes_id") REFERENCES "public"."morning_notes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_content_shelves_v_rels" ADD CONSTRAINT "_content_shelves_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_content_shelves_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_content_shelves_v_rels" ADD CONSTRAINT "_content_shelves_v_rels_content_shelves_fk" FOREIGN KEY ("content_shelves_id") REFERENCES "public"."content_shelves"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_content_shelves_v_rels" ADD CONSTRAINT "_content_shelves_v_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_content_shelves_v_rels" ADD CONSTRAINT "_content_shelves_v_rels_morning_notes_fk" FOREIGN KEY ("morning_notes_id") REFERENCES "public"."morning_notes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_testimonials_v_rels" ADD CONSTRAINT "_testimonials_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_testimonials_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_testimonials_v_rels" ADD CONSTRAINT "_testimonials_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_popups_v_rels" ADD CONSTRAINT "_popups_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_popups_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_popups_v_rels" ADD CONSTRAINT "_popups_v_rels_popups_fk" FOREIGN KEY ("popups_id") REFERENCES "public"."popups"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "form_submissions_rels" ADD CONSTRAINT "form_submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "form_submissions_rels" ADD CONSTRAINT "form_submissions_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "site_navigation_rels" ADD CONSTRAINT "site_navigation_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_navigation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "site_navigation_rels" ADD CONSTRAINT "site_navigation_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "mobile_hero_banner_rels" ADD CONSTRAINT "mobile_hero_banner_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."mobile_hero_banner"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "mobile_hero_banner_rels" ADD CONSTRAINT "mobile_hero_banner_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "videos_rels_order_idx" ON "videos_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "videos_rels_parent_idx" ON "videos_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "videos_rels_path_idx" ON "videos_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "videos_rels_media_id_idx" ON "videos_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "videos_rels_categories_id_idx" ON "videos_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "videos_rels_videos_id_idx" ON "videos_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "videos_rels_users_id_idx" ON "videos_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_rels_order_idx" ON "_videos_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_videos_v_rels_parent_idx" ON "_videos_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_rels_path_idx" ON "_videos_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_videos_v_rels_videos_id_idx" ON "_videos_v_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_rels_media_id_idx" ON "_videos_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_rels_categories_id_idx" ON "_videos_v_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "_videos_v_rels_users_id_idx" ON "_videos_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "categories_rels_order_idx" ON "categories_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "categories_rels_parent_idx" ON "categories_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "categories_rels_path_idx" ON "categories_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "categories_rels_media_id_idx" ON "categories_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_rels_order_idx" ON "_categories_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_categories_v_rels_parent_idx" ON "_categories_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_rels_path_idx" ON "_categories_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_categories_v_rels_categories_id_idx" ON "_categories_v_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "_categories_v_rels_media_id_idx" ON "_categories_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_rels_order_idx" ON "morning_notes_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "morning_notes_rels_parent_idx" ON "morning_notes_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_rels_path_idx" ON "morning_notes_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "morning_notes_rels_media_id_idx" ON "morning_notes_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_rels_videos_id_idx" ON "morning_notes_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_rels_forms_id_idx" ON "morning_notes_rels" USING btree ("forms_id");
  CREATE INDEX IF NOT EXISTS "morning_notes_rels_users_id_idx" ON "morning_notes_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_order_idx" ON "_morning_notes_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_parent_idx" ON "_morning_notes_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_path_idx" ON "_morning_notes_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_morning_notes_id_idx" ON "_morning_notes_v_rels" USING btree ("morning_notes_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_media_id_idx" ON "_morning_notes_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_videos_id_idx" ON "_morning_notes_v_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_forms_id_idx" ON "_morning_notes_v_rels" USING btree ("forms_id");
  CREATE INDEX IF NOT EXISTS "_morning_notes_v_rels_users_id_idx" ON "_morning_notes_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "tvapps_rels_order_idx" ON "tvapps_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "tvapps_rels_parent_idx" ON "tvapps_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "tvapps_rels_path_idx" ON "tvapps_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "tvapps_rels_media_id_idx" ON "tvapps_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_rels_order_idx" ON "_tvapps_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_rels_parent_idx" ON "_tvapps_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_rels_path_idx" ON "_tvapps_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_rels_tvapps_id_idx" ON "_tvapps_v_rels" USING btree ("tvapps_id");
  CREATE INDEX IF NOT EXISTS "_tvapps_v_rels_media_id_idx" ON "_tvapps_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "content_shelves_rels_order_idx" ON "content_shelves_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "content_shelves_rels_parent_idx" ON "content_shelves_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "content_shelves_rels_path_idx" ON "content_shelves_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "content_shelves_rels_videos_id_idx" ON "content_shelves_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "content_shelves_rels_morning_notes_id_idx" ON "content_shelves_rels" USING btree ("morning_notes_id");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_rels_order_idx" ON "_content_shelves_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_rels_parent_idx" ON "_content_shelves_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_rels_path_idx" ON "_content_shelves_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_rels_content_shelves_id_idx" ON "_content_shelves_v_rels" USING btree ("content_shelves_id");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_rels_videos_id_idx" ON "_content_shelves_v_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "_content_shelves_v_rels_morning_notes_id_idx" ON "_content_shelves_v_rels" USING btree ("morning_notes_id");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_rels_order_idx" ON "_testimonials_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_rels_parent_idx" ON "_testimonials_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_rels_path_idx" ON "_testimonials_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_testimonials_v_rels_testimonials_id_idx" ON "_testimonials_v_rels" USING btree ("testimonials_id");
  CREATE INDEX IF NOT EXISTS "_popups_v_rels_order_idx" ON "_popups_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_popups_v_rels_parent_idx" ON "_popups_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_popups_v_rels_path_idx" ON "_popups_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_popups_v_rels_popups_id_idx" ON "_popups_v_rels" USING btree ("popups_id");
  CREATE INDEX IF NOT EXISTS "form_submissions_rels_order_idx" ON "form_submissions_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "form_submissions_rels_parent_idx" ON "form_submissions_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "form_submissions_rels_path_idx" ON "form_submissions_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "form_submissions_rels_forms_id_idx" ON "form_submissions_rels" USING btree ("forms_id");
  CREATE INDEX IF NOT EXISTS "site_navigation_rels_order_idx" ON "site_navigation_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "site_navigation_rels_parent_idx" ON "site_navigation_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "site_navigation_rels_path_idx" ON "site_navigation_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "site_navigation_rels_media_id_idx" ON "site_navigation_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "mobile_hero_banner_rels_order_idx" ON "mobile_hero_banner_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "mobile_hero_banner_rels_parent_idx" ON "mobile_hero_banner_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "mobile_hero_banner_rels_path_idx" ON "mobile_hero_banner_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "mobile_hero_banner_rels_videos_id_idx" ON "mobile_hero_banner_rels" USING btree ("videos_id");
  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_content_shelves_fk" FOREIGN KEY ("content_shelves_id") REFERENCES "public"."content_shelves"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_content_shelves_fk" FOREIGN KEY ("content_shelves_id") REFERENCES "public"."content_shelves"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_videos_id_idx" ON "pages_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_forms_id_idx" ON "pages_rels" USING btree ("forms_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_content_shelves_id_idx" ON "pages_rels" USING btree ("content_shelves_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_users_id_idx" ON "pages_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_videos_id_idx" ON "_pages_v_rels" USING btree ("videos_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_forms_id_idx" ON "_pages_v_rels" USING btree ("forms_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_content_shelves_id_idx" ON "_pages_v_rels" USING btree ("content_shelves_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_users_id_idx" ON "_pages_v_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "videos_title_idx" ON "videos_locales" USING btree ("title");
  CREATE INDEX IF NOT EXISTS "_videos_v_version_version_title_idx" ON "_videos_v_locales" USING btree ("version_title");
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "featured_image_id";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "tv_hero_image_id";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "interviewee_image_id";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "category_id";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "behind_the_scenes_video_id";
  ALTER TABLE "videos" DROP COLUMN IF EXISTS "author_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "version_featured_image_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "version_tv_hero_image_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "version_interviewee_image_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "version_meta_image_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "version_category_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "version_behind_the_scenes_video_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "version_author_id";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_videos_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "pages_blocks_cf_video" DROP COLUMN IF EXISTS "cover_image_id";
  ALTER TABLE "pages_blocks_videos_grid_videos" DROP COLUMN IF EXISTS "video_id_id";
  ALTER TABLE "pages_blocks_form" DROP COLUMN IF EXISTS "form_id";
  ALTER TABLE "pages_blocks_media" DROP COLUMN IF EXISTS "media_id";
  ALTER TABLE "pages_blocks_items_grid_item" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "pages_blocks_slides_grid_slides" DROP COLUMN IF EXISTS "featured_image_id";
  ALTER TABLE "pages_blocks_slides_grid_slides" DROP COLUMN IF EXISTS "mobile_featured_image_id";
  ALTER TABLE "pages_blocks_slides_grid_slides" DROP COLUMN IF EXISTS "video_id";
  ALTER TABLE "pages_blocks_hero_banner_block" DROP COLUMN IF EXISTS "logo_id";
  ALTER TABLE "pages_blocks_hero_banner_block" DROP COLUMN IF EXISTS "trailer_id";
  ALTER TABLE "pages_blocks_hero_banner_block" DROP COLUMN IF EXISTS "video_id";
  ALTER TABLE "pages_blocks_hero_banner_block" DROP COLUMN IF EXISTS "bg_image_desktop_id";
  ALTER TABLE "pages_blocks_hero_banner_block" DROP COLUMN IF EXISTS "bg_image_mobile_id";
  ALTER TABLE "pages_blocks_tvapps" DROP COLUMN IF EXISTS "cta_image_id";
  ALTER TABLE "pages_blocks_content_shelf" DROP COLUMN IF EXISTS "content_shelf_id";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN IF EXISTS "mobile_image_id";
  ALTER TABLE "pages_blocks_trailer" DROP COLUMN IF EXISTS "video_id_id";
  ALTER TABLE "pages_blocks_trailer" DROP COLUMN IF EXISTS "thumbnail_id";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "author_id";
  ALTER TABLE "_pages_v_blocks_cf_video" DROP COLUMN IF EXISTS "cover_image_id";
  ALTER TABLE "_pages_v_blocks_videos_grid_videos" DROP COLUMN IF EXISTS "video_id_id";
  ALTER TABLE "_pages_v_blocks_form" DROP COLUMN IF EXISTS "form_id";
  ALTER TABLE "_pages_v_blocks_media" DROP COLUMN IF EXISTS "media_id";
  ALTER TABLE "_pages_v_blocks_items_grid_item" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" DROP COLUMN IF EXISTS "featured_image_id";
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" DROP COLUMN IF EXISTS "mobile_featured_image_id";
  ALTER TABLE "_pages_v_blocks_slides_grid_slides" DROP COLUMN IF EXISTS "video_id";
  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP COLUMN IF EXISTS "logo_id";
  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP COLUMN IF EXISTS "trailer_id";
  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP COLUMN IF EXISTS "video_id";
  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP COLUMN IF EXISTS "bg_image_desktop_id";
  ALTER TABLE "_pages_v_blocks_hero_banner_block" DROP COLUMN IF EXISTS "bg_image_mobile_id";
  ALTER TABLE "_pages_v_blocks_tvapps" DROP COLUMN IF EXISTS "cta_image_id";
  ALTER TABLE "_pages_v_blocks_content_shelf" DROP COLUMN IF EXISTS "content_shelf_id";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN IF EXISTS "mobile_image_id";
  ALTER TABLE "_pages_v_blocks_trailer" DROP COLUMN IF EXISTS "video_id_id";
  ALTER TABLE "_pages_v_blocks_trailer" DROP COLUMN IF EXISTS "thumbnail_id";
  ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_meta_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_author_id";
  ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "featured_image_id";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "logo_image_id";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "background_image_id";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "banner_image_nav_id";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "banner_image_desktop_id";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "banner_image_mobile_id";
  ALTER TABLE "categories" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "version_featured_image_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "version_logo_image_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "version_background_image_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "version_banner_image_nav_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "version_banner_image_desktop_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "version_banner_image_mobile_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "version_meta_image_id";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_categories_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "thumbnail_u_r_l";
  ALTER TABLE "morning_notes_sections_cards" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "morning_notes_blocks_cf_video" DROP COLUMN IF EXISTS "cover_image_id";
  ALTER TABLE "morning_notes_blocks_videos_grid_videos" DROP COLUMN IF EXISTS "video_id_id";
  ALTER TABLE "morning_notes_blocks_form" DROP COLUMN IF EXISTS "form_id";
  ALTER TABLE "morning_notes_blocks_media" DROP COLUMN IF EXISTS "media_id";
  ALTER TABLE "morning_notes_blocks_items_grid_item" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "morning_notes" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "morning_notes" DROP COLUMN IF EXISTS "author_id";
  ALTER TABLE "_morning_notes_v_version_sections_cards" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "_morning_notes_v_blocks_cf_video" DROP COLUMN IF EXISTS "cover_image_id";
  ALTER TABLE "_morning_notes_v_blocks_videos_grid_videos" DROP COLUMN IF EXISTS "video_id_id";
  ALTER TABLE "_morning_notes_v_blocks_form" DROP COLUMN IF EXISTS "form_id";
  ALTER TABLE "_morning_notes_v_blocks_media" DROP COLUMN IF EXISTS "media_id";
  ALTER TABLE "_morning_notes_v_blocks_items_grid_item" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "_morning_notes_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_morning_notes_v" DROP COLUMN IF EXISTS "version_meta_image_id";
  ALTER TABLE "_morning_notes_v" DROP COLUMN IF EXISTS "version_author_id";
  ALTER TABLE "_morning_notes_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_morning_notes_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "tvapps" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "tvapps" DROP COLUMN IF EXISTS "image_darkmode_id";
  ALTER TABLE "_tvapps_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_tvapps_v" DROP COLUMN IF EXISTS "version_image_id";
  ALTER TABLE "_tvapps_v" DROP COLUMN IF EXISTS "version_image_darkmode_id";
  ALTER TABLE "_tvapps_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_tvapps_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "content_shelves_videos" DROP COLUMN IF EXISTS "video_id";
  ALTER TABLE "content_shelves_morning_notes" DROP COLUMN IF EXISTS "morning_note_id";
  ALTER TABLE "_content_shelves_v_version_videos" DROP COLUMN IF EXISTS "video_id";
  ALTER TABLE "_content_shelves_v_version_morning_notes" DROP COLUMN IF EXISTS "morning_note_id";
  ALTER TABLE "_content_shelves_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_content_shelves_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_content_shelves_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "_testimonials_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_testimonials_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_testimonials_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "_popups_v" DROP COLUMN IF EXISTS "parent_id";
  ALTER TABLE "_popups_v" DROP COLUMN IF EXISTS "snapshot";
  ALTER TABLE "_popups_v" DROP COLUMN IF EXISTS "published_locale";
  ALTER TABLE "forms_blocks_select" DROP COLUMN IF EXISTS "placeholder";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "form_id";
  ALTER TABLE "site_navigation_items_columns_items" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "mobile_hero_banner_slider" DROP COLUMN IF EXISTS "video_id";
  ALTER TABLE "videos_timestamps_locales" ADD CONSTRAINT "videos_timestamps_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "videos_locales" ADD CONSTRAINT "videos_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "_videos_v_version_timestamps_locales" ADD CONSTRAINT "_videos_v_version_timestamps_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "_videos_v_locales" ADD CONSTRAINT "_videos_v_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_checkbox_locales" ADD CONSTRAINT "forms_blocks_checkbox_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_country_locales" ADD CONSTRAINT "forms_blocks_country_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_email_locales" ADD CONSTRAINT "forms_blocks_email_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_message_locales" ADD CONSTRAINT "forms_blocks_message_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_number_locales" ADD CONSTRAINT "forms_blocks_number_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_select_options_locales" ADD CONSTRAINT "forms_blocks_select_options_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_select_locales" ADD CONSTRAINT "forms_blocks_select_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_state_locales" ADD CONSTRAINT "forms_blocks_state_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_text_locales" ADD CONSTRAINT "forms_blocks_text_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_textarea_locales" ADD CONSTRAINT "forms_blocks_textarea_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_blocks_date_locales" ADD CONSTRAINT "forms_blocks_date_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_emails_locales" ADD CONSTRAINT "forms_emails_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "forms_locales" ADD CONSTRAINT "forms_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "public"."pages_blocks_cta" ALTER COLUMN "variant" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_cta_variant";
  CREATE TYPE "public"."enum_pages_blocks_cta_variant" AS ENUM('hide', 'gift', 'withDescription');
  ALTER TABLE "public"."pages_blocks_cta" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_cta_variant" USING "variant"::"public"."enum_pages_blocks_cta_variant";
  ALTER TABLE "public"."_pages_v_blocks_cta" ALTER COLUMN "variant" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_cta_variant";
  CREATE TYPE "public"."enum__pages_v_blocks_cta_variant" AS ENUM('hide', 'gift', 'withDescription');
  ALTER TABLE "public"."_pages_v_blocks_cta" ALTER COLUMN "variant" SET DATA TYPE "public"."enum__pages_v_blocks_cta_variant" USING "variant"::"public"."enum__pages_v_blocks_cta_variant";
  DROP TYPE "public"."enum__videos_v_published_locale";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum__categories_v_published_locale";
  DROP TYPE "public"."enum__morning_notes_v_published_locale";
  DROP TYPE "public"."enum__tvapps_v_published_locale";
  DROP TYPE "public"."enum__content_shelves_v_published_locale";
  DROP TYPE "public"."enum__testimonials_v_published_locale";
  DROP TYPE "public"."enum__popups_v_published_locale";\`)
}
`
