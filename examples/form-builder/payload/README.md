# Payload Form Builder Example

This example demonstrates how to implement the official [Form Builder Plugin](https://github.com/payloadcms/plugin-form-builder) into Payload.

There are various fully working front-ends made explicitly for this example, including:

- [Next.js Pages Router](../next-pages)

Follow the instructions in each respective README to get started. If you are setting up the Form Builder for another front-end, please consider contributing to this repo with your own example!

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:8000/admin` to access the admin panel
6. Login with email `demo@payloadcms.com` and password `demo`

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.

## How it works

The [Form Builder Plugin](https://github.com/payloadcms/plugin-form-builder) automatically adds the `forms` and `formSubmissions` collections to your config which your front-end can use to query forms and submit form data. You can embed forms into layout building blocks by referring a `forms` document in a relationship field.

See the official [Form Builder Plugin](https://github.com/payloadcms/plugin-form-builder) for full details.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to create a user, a home page, and some basic forms.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).

