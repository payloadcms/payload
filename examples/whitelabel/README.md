# Payload White-label Example

This example demonstrates how to re-brand or white-label the [Payload Admin Panel](https://payloadcms.com/docs/admin/overview#the-admin-panel) by modifying the favicon, icon, logo, ogImage and title suffix.

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:8000/admin` to access the admin panel
6. Login with email `dev@payloadcms.com` and password `test`

## Re-branding walkthrough

Start by navigating to the `payload.config.ts` file and then take a look at the admin property.

The following sub-properties have already been configured:

`favicon`: Image that will be displayed as the tab icon.

`ogImage`: Image that will appear in the preview when you share links to your admin panel online and through social media.

`titleSuffix`: Text that appends the meta/page title displayed in the browser tab — _must be a string_.

`graphics.Logo`: Image component to be displayed as the logo on the Sign Up / Login view.

`graphics.Icon`: Image component displayed above the Nav in the admin panel, often a condensed version of a full logo.

👉 Check out this blog post for a more in-depth walkthrough: [White-label the Admin UI](https://payloadcms.com/blog/white-label-admin-ui)

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to create a user.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
