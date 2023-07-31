# Payload Website Template

This is the official [Payload Website Template](https://github.com/payloadcms/payload/blob/master/templates/website). Use it to power websites, blogs, and portfolios of all sizes. This repo includes a fully-working backend, enterprise-grade admin panel, and a beautifully designed, production-ready website.

This template is right for you if you are:

- Building a fast, modern website
- Distributing content in many languages and formats
-

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Draft Preview](#draft-preview)
- [ISR](#isr)
- [](#)
- [](#)
- [Redirects](#redirects)
- [Layout Builder](#layout-builder)
- [SEO](#seo)
- [Website](#website)

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

#### Method 1 (recommended)

  Go to Payload Cloud and [clone this template](https://payloadcms.com/new/clone/website). This will create a new repository on your GitHub account with this template's code which you can then clone to your own machine.

#### Method 2

  Use the `create-payload-app` CLI to clone this template directly to your machine:

    npx create-payload-app my-project -t website

#### Method 3

  Use the `git` CLI to clone this template directly to your machine:

    git clone -n --depth=1 --filter=tree:0 https://github.com/payloadcms/payload my-project && cd my-project && git sparse-checkout set --no-cone templates/website && git checkout && rm -rf .git && git init && git add . && git mv -f templates/website/{.,}* . && git add . && git commit -m "Initial commit"

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. `yarn && yarn dev` to install dependencies and start the dev server
1. `open http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections)  docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled and encompass both admins and customers based on the value of their `roles` field. Only `admin` users can access your admin panel to manage your store whereas `customer` can authenticate on your front-end to create [shopping carts](#shopping-cart) and place [orders](#orders) but have limited access to the platform. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/master/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details.

- #### Media

  This is the uploads enabled collection used by products and pages to contain media like images, videos, downloads, and other assets.

- #### Categories

  A taxonomy used to group products together. Categories can be nested inside of one another, for example "Courses > Technology". See the official [Payload Nested Docs Plugin](https://github.com/payloadcms/plugin-nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic role-based access control is setup to determine what users can and cannot do based on their roles, which are:

- `admin`: They can access the Payload admin panel to manage your store. They can see all data and make all operations.
- `user`: They cannot access the Payload admin panel and can perform limited operations based on their user (see below).

This applies to each collection in the following ways:

- `users`: Only admins and the user themselves can access their profile. Anyone can create a user but only admins can delete users.
- `pages`: Everyone can access published pages, but only admins can create, update, or delete them.
- `projects`: Same as above.
- `posts`: Same as above.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Redirects

This template comes pre-configured with the official [Payload Redirects Plugin](https://github.com/payloadcms/plugin-redirects) so you can properly redirect content as your website scales.

For additional help, see the official [Redirects Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms#readme).

## Layout Builder

Create unique page, project, and post layouts for any type fo content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and built into the front-end website that comes with this template. See [Website](#website) for more details.

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://github.com/payloadcms/plugin-seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Website

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a single Express server. This makes is so that you can deploy both apps simultaneously and host them together. If you prefer a different front-end framework, this pattern works for any framework that supports a custom server. If you prefer to host your website separately from Payload, you can easily [Eject](#eject) the front-end out from this template to swap in your own, or to use it as a standalone CMS. For more details, see the official [Custom Server Example](https://github.com/payloadcms/payload/tree/master/examples/custom-server).

Core features:

- [Next.js App Router](https://nextjs.org)
- [GraphQL](https://graphql.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload-admin-bar)
- Complete blog with categories and tags
- Complete portfolio with categories and tags
- Dark mode
- Pre-made layout building blocks
- Complete SEO integration

### Eject

If you prefer another front-end framework or would like to use Payload as a standalone CMS, you can easily eject the front-end from this template. To eject, simply run `yarn eject`. This will uninstall all Next.js related dependencies and delete all files and folders related to the Next.js front-end. It also removes all custom routing from your `server.ts` file and updates your `eslintrc.js`.

> Note: Your eject script may not work as expected if you've made significant modifications to your project. If you run into any issues, compare your project's dependencies and file structure with this template. See [./src/eject](./src/eject) for full details.

For more details on how setup a custom server, see the official [Custom Server Example](https://github.com/payloadcms/payload/tree/master/examples/custom-server).

##  Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, projects, and posts.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few pages, projects, and posts, you can run `yarn seed`. This template also comes with a `GET /api/seed` endpoint you can use to seed the database from the admin panel.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. Invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Finally run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.
1. When you're ready to go live, see [Deployment](#deployment) for more details.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).

## Preview

To enter preview mode we format a custom URL using a [preview function](https://payloadcms.com/docs/configuration/collections#preview) in the collection config. When a user clicks the "Preview" button, they are routed to this URL along with their http-only cookies and revalidation key. Your front-end can then use the `payload-token` and revalidation key to verify the request and enter into its own preview mode.

For more information, see the official [Preview Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms#readme).

## ISR

If your front-end is statically generated then you may also want to regenerate the HTML for each page as they are published, sometimes referred to as Incremental Static Regeneration. To do this, we add an `afterChange` hook to the collection that fires a request to your front-end in the background each time the document is updated. You can handle this request on your front-end and regenerate the HTML for your page however needed.

For more information, see the official [Preview Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms#isr) which includes ISR.

## Nested Docs

This template comes pre-configured with the official [Payload Nested Docs Plugin](https://github.com/payloadcms/plugin-nested-docs) so you can easily create hierarchies of pages, posts, and categories.
