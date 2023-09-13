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

### Setup

1. First, clone the repo
1. Then `cd YOUR_PROJECT_REPO && cp .env.example .env`
1. Next `yarn && yarn seed` to start the app and seed it with example data
1. Now `open http://localhost:3000` to view the site 

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.

### Editing Content

To access the Admin interface, where you can edit content:

1. Go to `http://localhost:3000/admin` 
1. Login with `dev@payloadcms.com` / `test`

## How it works

When you use Payload, you plug it into _**your**_ Express server. That's a fundamental difference between Payload and other application frameworks. It means that when you use Payload, you're technically _adding_ Payload to _your_ app, and not building a "Payload app".

One of the strengths of this pattern is that it lets you do powerful things like integrate your Payload instance directly with your front-end. This will allow you to host Payload alongside a fully dynamic, CMS-integrated website or app on a single, combined server—while still getting all of the benefits of a headless CMS.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to scaffold a basic database for you to use as an example. This is done by setting the `PAYLOAD_DROP_DATABASE` and `PAYLOAD_SEED` environment variables which are included in the `.env.example` by default. You can remove these from your `.env` to prevent this behavior. You can also freshly seed your project at any time by running `yarn seed`. This seed creates:

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
