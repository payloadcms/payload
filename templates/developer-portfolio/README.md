# Payload Developer Portfolio Example

This example demonstrates a complete professional portfolio application using [Payload](https://github.com/payloadcms/payload) and NextJS in a single Express server.

## Highlights

- 💪 **Batteries-Included**
  - Design beautiful pages, describe portfolio projects, and build forms dynamically without writing code
- 🔎 **SEO-Friendly**
  - Includes [SEO plugin](https://github.com/payloadcms/plugin-seo) integration to author and preview page metadata
- 🪭 **Customization-Friendly**
  - Light/dark mode, [@shadcn/ui](https://ui.shadcn.com/) integration, prebuilt animations, and modular CMS "blocks" encourage extension and re-use
- 🏎️ **Performance-Focused**
  - Uses React Server Components, App Router, and `next/image` to optimize Web Vitals metrics
- 🦯 **Accessibility-Minded**
  - Navigation, contrast, dialogs, and forms built with [WCAG 2](https://www.w3.org/WAI/standards-guidelines/wcag/) in mind

## Quick Start

### Prerequisites

- [Node](https://nodejs.org/en) 18.x or newer
- [MongoDB](https://www.mongodb.com/try/download/community)

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

#### Method 1 (recommended)

  Go to Payload Cloud and [clone this template](https://payloadcms.com/new/clone/developer-portfolio). This will create a new repository on your GitHub account with this template's code which you can then clone to your own machine.

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. `yarn && yarn dev` to install dependencies and start the dev server
1. `open http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How it works

When you use Payload, you plug it into _**your**_ Express server. That's a fundamental difference between Payload and other application frameworks. It means that when you use Payload, you're technically _adding_ Payload to _your_ app, and not building a "Payload app".

One of the strengths of this pattern is that it lets you do powerful things like integrate your Payload instance directly with your front-end. This will allow you to host Payload alongside a fully dynamic, CMS-integrated website or app on a single, combined server—while still getting all of the benefits of a headless CMS.

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users in the platform can authenticate to interact with features such as adding projects comments and updating pages. Everyone has the same level of access on the platform. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/master/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Projects

  Projects are used to showcase your work. All projects are layout builder enabled so you can generate unique layouts for each project using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Projects are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Pages are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Media

  This is the uploads enabled collection used by pages, posts, and projects to contain media like images, videos, downloads, and other assets.

- #### Technologies

  A taxonomy used on projects to display what technologies were utilized on each project.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Profile`

  The data required for the Developer in question of the portfolio.

## Layout Builder

Create unique page and project layouts for any type of content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- ### Pages

  - Content
  - Form Block
  - Media Block
  - Media Content
  - Profile Call to Action
  - Project Grid

- ### Projects

  - Content
  - Form Block
  - Media Block
  - Media Content

Each block is fully designed and built into the front-end website that comes with this template. See [Developer Portfolio](#developer-portfolio) for more details.

## Draft Preview

All pages and projects are draft-enabled so you can preview them before publishing them to your website. To do this, these collections use [Versions](https://payloadcms.com/docs/configuration/collections#versions) with `drafts` set to `true`. This means that when you create a new page or project, it will be saved as a draft and will not be visible on your portfolio until you publish it. This also means that you can preview your draft before publishing it to your portfolio. To do this, we automatically format a custom URL which redirects to your front-end to securely fetch the draft version of your content.

Since the front-end of this template is statically generated, this also means that pages and projects will need to be regenerated as changes are made to published documents. To do this, we use an `afterChange` hook to regenerate the front-end when a document has changed and its `_status` is `published`.

For more details on how to extend this functionality, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/master/examples/draft-preview).

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://github.com/payloadcms/plugin-seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Developer Portfolio](#developer-potfolio) for more details.

## Developer Portfolio

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a single Express server. This makes is so that you can deploy both apps simultaneously and host them together. If you prefer a different front-end framework, this pattern works for any framework that supports a custom server. If you prefer to host your website separately from Payload, you can easily [Eject](#eject) the front-end out from this template to swap in your own, or to use it as a standalone CMS. For more details, see the official [Custom Server Example](https://github.com/payloadcms/payload/tree/master/examples/custom-server).

Core features:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- Authentication
- Fully featured projects
- Publication workflow
- User accounts
- Dark mode
- Pre-made layout building blocks
- SEO

### Cache

Although Next.js includes a robust set of caching strategies out of the box, Payload Cloud proxies and caches all files through Cloudflare using the [Official Cloud Plugin](https://github.com/payloadcms/plugin-cloud). This means that Next.js caching is not needed and is disabled by default. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching).

### Eject

If you prefer another front-end framework or would like to use Payload as a standalone CMS, you can easily eject the front-end from this template. To eject, simply run `yarn eject`. This will uninstall all Next.js related dependencies and delete all files and folders related to the Next.js front-end. It also removes all custom routing from your `server.ts` file and updates your `eslintrc.js`.

> Note: Your eject script may not work as expected if you've made significant modifications to your project. If you run into any issues, compare your project's dependencies and file structure with this template. See [./src/eject](./src/eject) for full details.

For more details on how setup a custom server, see the official [Custom Server Example](https://github.com/payloadcms/payload/tree/master/examples/custom-server).

##  Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, posts, and projects.

### Seed

To seed the database, you can run `yarn seed`. This template also comes with a `GET /api/seed` endpoint you can use to seed the database from the admin panel.

This seed creates:

- An admin user with email `dev@payloadcms.com`, password `test`,
- A `home` page with Profile CTA, project grid, and contact form
- Example header and profile data
- Example media assets
- Example portfolio projects

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First, invoke the `payload build` script by running `yarn build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then, run `yarn serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also choose to self-host your app, check out the [Deployment](https://payloadcms.com/docs/production/deployment) docs for more details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
