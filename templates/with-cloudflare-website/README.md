# Payload Website Template with Cloudflare D1 & R2

This is the official [Payload Website Template](https://github.com/payloadcms/payload/blob/main/templates/website) configured for deployment on Cloudflare Workers with D1 (SQLite) database and R2 object storage.

Use it to power websites, blogs, or portfolios from small to enterprise, all running on Cloudflare's edge network.

This template is right for you if you are working on:

- A personal or enterprise-grade website, blog, or portfolio deployed on Cloudflare
- A content publishing platform with a fully featured publication workflow
- Edge-first applications with global distribution
- Exploring the capabilities of Payload with Cloudflare infrastructure

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Cloudflare D1 Database](#cloudflare-d1)
- [Cloudflare R2 Storage](#cloudflare-r2)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Layout Builder](#layout-builder)
- [Draft Preview](#draft-preview)
- [Live Preview](#live-preview)
- [On-demand Revalidation](#on-demand-revalidation)
- [SEO](#seo)
- [Search](#search)
- [Redirects](#redirects)
- [Jobs and Scheduled Publishing](#jobs-and-scheduled-publish)
- [Website](#website)

## Quick Start

To spin up this example locally, follow these steps:

### Prerequisites

1. Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
2. Login to Cloudflare: `wrangler login`

### Clone

Use the `create-payload-app` CLI to clone this template directly to your machine:

```bash
pnpx create-payload-app my-project -t with-cloudflare-website
```

### Cloudflare Setup

1. Create a D1 database:

   ```bash
   wrangler d1 create my-website
   ```

   Copy the `database_id` from the output and update `wrangler.jsonc`.

2. Create an R2 bucket:

   ```bash
   wrangler r2 bucket create my-website
   ```

3. Update `wrangler.jsonc` with your database and bucket names.

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. Update `PAYLOAD_SECRET` in `.env` (generate with `openssl rand -hex 32`)
1. `pnpm install && pnpm dev` to install dependencies and start the dev server
1. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user.

### Database Migrations

**Important:** Before deploying to Cloudflare, you must generate and apply database migrations to create all the necessary tables.

1. Generate migrations (creates SQL files for your schema):

   ```bash
   pnpm payload migrate:create
   ```

   This will create migration files in `src/migrations/` based on your collections.

2. Apply migrations to your remote D1 database:

   ```bash
   # Set your environment (production, staging, etc.)
   export CLOUDFLARE_ENV=production

   # Push migrations to D1
   pnpm run deploy:database
   ```

   Or manually with wrangler:

   ```bash
   wrangler d1 migrations apply D1 --remote --env=production
   ```

3. For local development, migrations are automatically applied when you run `pnpm dev`.

> **Note:** If you see "Failed query" errors after deployment, it usually means migrations haven't been applied. Run `pnpm run deploy:database` to fix this.

### Deployment

1. Generate migrations (if not done already):

   ```bash
   pnpm payload migrate:create
   ```

2. Set your Cloudflare environment variables in Cloudflare Pages dashboard:

   - `PAYLOAD_SECRET` - Your secret key (generate with `openssl rand -hex 32`)

3. Deploy:

   ```bash
   export CLOUDFLARE_ENV=production
   pnpm run deploy
   ```

   This runs `deploy:database` (applies migrations) then `deploy:app` (builds and deploys).

## Cloudflare D1

This template uses [Cloudflare D1](https://developers.cloudflare.com/d1/), a serverless SQLite database, as the database adapter. D1 provides:

- Automatic global replication
- Edge-first performance
- Zero cold starts
- Generous free tier

The database is configured in `wrangler.jsonc` and accessed via the `@payloadcms/db-d1-sqlite` adapter.

## Cloudflare R2

Media uploads are stored in [Cloudflare R2](https://developers.cloudflare.com/r2/), Cloudflare's S3-compatible object storage. R2 provides:

- No egress fees
- Global distribution via Cloudflare's network
- S3-compatible API

The storage is configured using the `@payloadcms/storage-r2` plugin.

> Note: Image resizing and focal point features are not available on Cloudflare Workers due to lack of sharp support. Images are stored and served as-is.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel and unpublished content. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Posts

  Posts are used to generate blog posts, news articles, or any other type of content that is published over time. All posts are layout builder enabled so you can generate unique layouts for each post using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Posts are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Pages are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Media

  This is the uploads enabled collection used by pages, posts, and projects to contain media like images, videos, downloads, and other assets. Media is stored in Cloudflare R2.

  > Note: Image resizing features are not available on Cloudflare Workers due to lack of sharp support.

- #### Categories

  A taxonomy used to group posts together. Categories can be nested inside of one another, for example "News > Technology". See the official [Payload Nested Docs Plugin](https://payloadcms.com/docs/plugins/nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic access control is setup to limit access to various content based based on publishing status.

- `users`: Users can access the admin panel and create or edit content.
- `posts`: Everyone can access published posts, but only users can create, update, or delete them.
- `pages`: Everyone can access published pages, but only users can create, update, or delete them.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Layout Builder

Create unique page layouts for any type of content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and built into the front-end website that comes with this template. See [Website](#website) for more details.

## Lexical editor

A deep editorial experience that allows complete freedom to focus just on writing content without breaking out of the flow with support for Payload blocks, media, links and other features provided out of the box. See [Lexical](https://payloadcms.com/docs/rich-text/overview) docs.

## Draft Preview

All posts and pages are draft-enabled so you can preview them before publishing them to your website. To do this, these collections use [Versions](https://payloadcms.com/docs/configuration/collections#versions) with `drafts` set to `true`. This means that when you create a new post, project, or page, it will be saved as a draft and will not be visible on your website until you publish it. This also means that you can preview your draft before publishing it to your website. To do this, we automatically format a custom URL which redirects to your front-end to securely fetch the draft version of your content.

Since the front-end of this template is statically generated, this also means that pages, posts, and projects will need to be regenerated as changes are made to published documents. To do this, we use an `afterChange` hook to regenerate the front-end when a document has changed and its `_status` is `published`.

For more details on how to extend this functionality, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/examples/draft-preview).

## Live preview

In addition to draft previews you can also enable live preview to view your end resulting page as you're editing content with full support for SSR rendering. See [Live preview docs](https://payloadcms.com/docs/live-preview/overview) for more details.

## On-demand Revalidation

We've added hooks to collections and globals so that all of your pages, posts, footer, or header changes will automatically be updated in the frontend via on-demand revalidation supported by Nextjs.

> Note: if an image has been changed, for example it's been cropped, you will need to republish the page it's used on in order to be able to revalidate the Nextjs image cache.

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Search

This template also pre-configured with the official [Payload Search Plugin](https://payloadcms.com/docs/plugins/search) to showcase how SSR search features can easily be implemented into Next.js with Payload. See [Website](#website) for more details.

## Redirects

If you are migrating an existing site or moving content to a new URL, you can use the `redirects` collection to create a proper redirect from old URLs to new ones. This will ensure that proper request status codes are returned to search engines and that your users are not left with a broken link. This template comes pre-configured with the official [Payload Redirects Plugin](https://payloadcms.com/docs/plugins/redirects) for complete redirect control from the admin panel. All redirects are fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Jobs and Scheduled Publish

We have configured [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish) which uses the [jobs queue](https://payloadcms.com/docs/jobs-queue/jobs) in order to publish or unpublish your content on a scheduled time. The tasks are run on a cron schedule and can also be run as a separate instance if needed.

> Note: When deployed on Cloudflare Workers, you can use Cloudflare Cron Triggers for scheduled tasks.

## Website

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a instance. This makes it so that you can deploy both your backend and website where you need it.

Core features:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload/tree/main/packages/admin-bar)
- [TailwindCSS styling](https://tailwindcss.com/)
- [shadcn/ui components](https://ui.shadcn.com/)
- User Accounts and Authentication
- Fully featured blog
- Publication workflow
- Dark mode
- Pre-made layout building blocks
- SEO
- Search
- Redirects
- Live preview

### Cache

Since this template runs on Cloudflare's edge network, caching is handled at the edge. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching) and [Cloudflare Cache documentation](https://developers.cloudflare.com/cache/).

## Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, posts, and projects.

### Working with D1 (SQLite)

D1 and other SQL-based databases follow a strict schema for managing your data. This means that there are a few extra steps compared to working with MongoDB.

Note that often times when making big schema changes you can run the risk of losing data if you're not manually migrating it.

#### Local development

During local development, Wrangler provides a local D1 instance that mirrors your production database schema. Schema changes are applied via migrations.

#### Migrations

[Migrations](https://payloadcms.com/docs/database/migrations) are essentially SQL code versions that keeps track of your schema. When deploying with D1 you will need to make sure you create and then run your migrations.

Locally create a migration:

```bash
pnpm payload migrate:create
```

This creates the migration files you will need to push alongside with your new configuration.

When deploying, migrations are automatically run as part of the deploy process:

```bash
pnpm run deploy
```

This command will check for any migrations that have not yet been run and try to run them and it will keep a record of migrations that have been run in the database.

### Seed

To seed the database with a few pages, posts, and projects you can click the 'seed database' link from the admin panel.

The seed script will also create a demo user for demonstration purposes only:

- Demo Author
  - Email: `demo-author@payloadcms.com`
  - Password: `password`

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

### Deploying to Cloudflare

This template is designed to be deployed to Cloudflare Workers. To deploy:

1. Ensure you have set up your D1 database and R2 bucket (see [Cloudflare Setup](#cloudflare-setup))

2. Update `wrangler.jsonc` with your database and bucket configuration

3. Set your `PAYLOAD_SECRET` environment variable in Cloudflare:

   ```bash
   wrangler secret put PAYLOAD_SECRET
   ```

4. Deploy your application:
   ```bash
   pnpm run deploy
   ```

This will:

- Run database migrations
- Build your Next.js application with OpenNext
- Deploy to Cloudflare Workers

### Preview Deployment

To test your deployment locally before going live:

```bash
pnpm run preview
```

### Environment-specific Deployments

You can configure multiple environments in `wrangler.jsonc` (e.g., staging, production) and deploy to them using:

```bash
CLOUDFLARE_ENV=staging pnpm run deploy
```

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
