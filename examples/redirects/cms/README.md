# Payload Redirects Example

This example demonstrates how to implement http redirects into Payload using the official [Redirects Plugin](https://github.com/payloadcms/plugin-redirects).

There is a fully working Next.js app made explicitly for this example which can be found [here](../nextjs). Follow the instructions there to get started. If you are setting up redirects for another front-end, please consider contributing to this repo with your own example!

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:8000/admin` to access the admin panel
6. Login with email `dev@payloadcms.com` and password `test`

## How it works

The [Redirects Plugin](https://github.com/payloadcms/plugin-redirects) automatically adds a `redirects` collection to your config which your front-end can fetch and inject them into its own router. The redirect fields are:

- `from` This is a URL string that will be matched against the request path.
- `to` This is a conditional field that allows you to select between related documents or a custom URL.

See the official [Redirects Plugin](https://github.com/payloadcms/plugin-redirects) for full details.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to create a user, a home page, and a the following redirects for you to test with:

- From `/redirect-to-external` to `https://payloadcms.com`
- From `/redirect-to-internal` to `/redirected`

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/r6sCXqVk3v) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
