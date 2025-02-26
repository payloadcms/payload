# Payload Form Builder Example

The [Payload Form Builder Example](https://github.com/payloadcms/payload/tree/main/examples/form-builder/payload) demonstrates how to implement the official [Form Builder Plugin](https://payloadcms.com/docs/plugins/form-builder) in [Payload](https://github.com/payloadcms/payload).

**IMPORTANT—This example includes a fully integrated Next.js App Router front-end that runs on the same server as Payload.**

## Quick Start

1. Run the following command to create a project from the example:

- `npx create-payload-app --example form-builder`

2. `cp .env.example .env` to copy the example environment variables

3. `pnpm dev`, `yarn dev` or `npm run dev` to start the server
   - Press `y` when prompted to seed the database
4. `open http://localhost:3000` to access the home page
5. `open http://localhost:3000/admin` to access the admin panel
   - Login with email `demo@payloadcms.com` and password `demo`

That's it! Changes made in `./src` will be

## How it works

The [Form Builder Plugin](https://payloadcms.com/docs/plugins/form-builder) automatically adds the `forms` and `formSubmissions` collections to your config which your front-end can use to query forms and submit form data. You can embed forms into layout building blocks by referring a `forms` document in a relationship field.

See the official [Form Builder Plugin](https://payloadcms.com/docs/plugins/form-builder) for full details.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to scaffold a basic database for you to use as an example. You can remove `pnpm seed` from the `dev` script in the `package.json` to prevent this behavior. You can also freshly seed your project at any time by running `pnpm seed`. This seed creates a user with email `demo@payloadcms.com` and password `demo` along with a home page and an example page with two versions, one published and the other draft.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also choose to self-host your app, check out the [Deployment](https://payloadcms.com/docs/production/deployment) docs for more details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
