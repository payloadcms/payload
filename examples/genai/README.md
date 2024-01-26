# Payload GenAI

A Generative AI template for [Payload](https://github.com/payloadcms/payload) to help you get up and running quickly. This repo was created by running `npx create-payload-app@latest` and selecting the "blank" template and then modified with GenAI capabilities.

See the official [Examples Directory](https://github.com/payloadcms/payload/tree/main/examples) for details on how to use Payload in a variety of different ways.

## Development

To spin up the project locally, follow these steps:

1. First clone the repo
1. Then `cd YOUR_PROJECT_REPO && cp .env.example .env`
1. Next `yarn && yarn dev` (or `docker-compose up`, see [Docker](#docker))
1. Now `open http://localhost:3000/admin` to access the admin panel
1. Create your first admin user using the form on the page

That's it! Changes made in `./src` will be reflected in your app.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
