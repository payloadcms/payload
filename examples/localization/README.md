# Payload Localization Example (i18n)

This example is built based on an old version of the website template.

The objective is to show how to implement localization in a website. There is no guarantee that it will be kept up to date with the website template or the latest Payload enhancements.

To facilitate the localization process, this example uses the next-intl library.

## Setup

1. Run the following command to create a project from the example:

- `npx create-payload-app --example localization`

2. `cp .env.example .env` (copy the .env.example file to .env)
3. `pnpm install`
4. `pnpm run dev`
5. Seed your database in the admin panel (see below)

## Seed

To seed the database with a few pages, posts, and projects you can click the 'seed database' link from the admin panel.

The seed script will also create a demo user for demonstration purposes only:

- Demo Author
  - Email: `demo-author@payloadcms.com`
  - Password: `password`

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Important!

The seed script only creates translations in English and Spanish, so you will not see the website translated to other languages even if you see them in the dropdown menu.

You can translate documents to other languages from the admin panel.
