# Payload Website Template

A template for [Payload](https://github.com/payloadcms/payload) to power websites from small to enterprise. This repo may have been created by running `npx create-payload-app` and selecting the "website" template or by cloning this template on [Payload Cloud](https://payloadcms.com/new/clone/blank).

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Access Control](#access-control)
- [Preview](#preview)
- [ISR](#isr)
- [Nested Docs](#nested-docs)
- [Layout Builder](#layout-builder)
- [SEO](#seo)
- [Redirects](#redirects)

For details on how to get this template up and running locally, see the [development](#development) section.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [collections documentation](https://payloadcms.com/docs/configuration/collections) for details on how to extend this functionality.

- #### Users

  Users are auth-enabled and encompass both admins and public users based on the value of their `roles` field. Only `admin` users can access your admin panel to manage your website's content whereas `user` has limited access to the platform, see [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/master/examples/auth/cms#readme) or the [authentication docs](https://payloadcms.com/docs/authentication/overview#authentication-overview).

- #### Pages

  All pages are layout-builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. They can also be nested inside of one another, for example "About > Team". See [Nested Docs](#nested-docs) for more details.

- #### Posts

  All posts are layout-builder enabled so you can generate unique layouts for each post using layout-building blocks, see [Layout Builder](#layout-builder) for more details. They can also be nested inside of one another, for example "News > World". See [Nested Docs](#nested-docs) for more details.

- #### Media

  This is the uploads-enabled collection used by pages and products to contain media, etc.

- #### Categories

  A taxonomy used to group posts together. Categories can be nested inside of one another, for example "News > World". See the official [Payload Nested Docs Plugin](https://github.com/payloadcms/plugin-nested-docs) for more details.

### Globals

See the [globals documentation](https://payloadcms.com/docs/configuration/globals) for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end, i.e. nav links, etc.

- `Footer`

  Same as above but for the footer of your site.

## Access Control

Basic role-based access control is setup to determine what users can and cannot do based on their roles, which are:

- `admin`: They can access the Payload admin panel to manage your website. They can see all data and make all operations.
- `user`: They cannot access the Payload admin panel and have a limited access to operations based on their user (see below).

This applies to each collection in the following ways:

- `users`: Only admins and the user themselves can access their profile. Only admins can create and delete users.
- `pages`: Everyone can see published pages but only admins can see drafts and create, update, and delete pages.
- `posts`: Same as pages.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Preview

To enter preview mode we format a custom URL using a [preview function](https://payloadcms.com/docs/configuration/collections#preview) in the collection config. When a user clicks the "Preview" button, they are routed to this URL along with their http-only cookies and revalidation key. Your front-end can then use the `payload-token` and revalidation key to verify the request and enter into its own preview mode.

For more information, see the official [Preview Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms#readme).

## ISR

If your front-end is statically generated then you may also want to regenerate the HTML for each page as they are published, sometimes referred to as Incremental Static Regeneration. To do this, we add an `afterChange` hook to the collection that fires a request to your front-end in the background each time the document is updated. You can handle this request on your front-end and regenerate the HTML for your page however needed.

For more information, see the official [Preview Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms#isr) which includes ISR.

## Nested Docs

This template comes pre-configured with the official [Payload Nested Docs Plugin](https://github.com/payloadcms/plugin-nested-docs) so you can easily create hierarchies of pages, posts, and categories.

## Layout Builder

Pages and posts can be built using a powerful layout builder. This allows you to create unique layouts for each page or post. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://github.com/payloadcms/plugin-seo) so you can easily manage metadata for each page of your website.

## Redirects

This template comes pre-configured with the official [Payload Redirects Plugin](https://github.com/payloadcms/plugin-redirects) so you can properly redirect content as your website scales.

For additional help, see the official [Redirects Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms#readme).

## Development

To spin up the template locally, follow these steps:

1. First clone the repo
1. Then `cd YOUR_PROJECT_REPO && cp .env.example .env`
1. Next `yarn && yarn dev` (or `docker-compose up`, see [Docker](#docker))
1. Now `open http://localhost:8000/admin` to access the admin panel
1. Create your first admin user using the form on the page

That's it! Changes made in `./src` will be reflected in your app—but your database is blank. You can optionally seed the database with a few pages and posts, more details on that [here](#seed).

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few pages and posts you can run `yarn seed`.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
