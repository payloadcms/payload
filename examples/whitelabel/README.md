# Payload White-label Example

This example demonstrates how to re-brand or white-label the [Payload Admin Panel](https://payloadcms.com/docs/admin/overview#the-admin-panel) by modifying the favicon, icon, logo, ogImage and title suffix.

## Quick Start

To spin up this example locally, follow these steps:

1. Run the following command to create a project from the example:

- `npx create-payload-app --example whitelabel`

2. `cp .env.example .env` to copy the example environment variables
3. `pnpm install && pnpm dev` to install dependencies and start the dev server
4. `open http://localhost:3000/admin` to access the admin panel
5. Login with email `dev@payloadcms.com` and password `test`

## Re-branding walkthrough

Start by navigating to the `payload.config.ts` file and then take a look at the admin property.

The following sub-properties have already been configured:

`meta.icons`: Images that will be displayed as the tab icon.

`meta.openGraph.images`: Images that will appear in the preview when you share links to your admin panel online and through social media.

`meta.titleSuffix`: Text that appends the meta/page title displayed in the browser tab — _must be a string_.

`graphics.Logo`: Image component to be displayed as the logo on the Sign Up / Login view.

`graphics.Icon`: Image component displayed above the Nav in the admin panel, often a condensed version of a full logo.

👉 Check out this blog post for a more in-depth walkthrough: [White-label the Admin UI](https://payloadcms.com/blog/white-label-admin-ui)

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to create a user.

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
