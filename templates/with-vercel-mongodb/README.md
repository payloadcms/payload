# Payload Blank Starter

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/payloadcms/payload/tree/main/templates/with-vercel-mongodb&project-name=payload-project&env=PAYLOAD_SECRET&build-command=pnpm%20run%20ci&stores=%5B%7B%22type%22:%22blob%22%7D%5D&integration-ids=oac_jnzmjqM10gllKmSrG0SGrHOH)

This template comes configured with the bare minimum to get started on anything you need.

## Quick start

Click the 'Deploy' button above to spin up this template directly into Vercel hosting. It will first prompt you save this template into your own Github repo so that you own the code and can make any changes you want to it.

Set up the following services and secrets and then once the app has been built and deployed you will be able to visit your site at the generated URL.
From this point on you can access your admin panel at `/admin` of your app URL, create an admin user and then click the 'Seed the database' button in the dashboard to add content into your app.

### Services

This project uses the following services integrated into Vercel which you will need to click "Add" and "Connect" for:

Mongo Atlas - MongoDB-based cloud database used to host your data

Vercel Blob Storage - object storage used to host your files such as images and videos

The connection variables will automatically be setup for you on Vercel when these services are connected.

#### Secrets

You will be prompted to add the following secret values to your project. These should be long unguessable strong passwords, you can also use a password manager to generate one for these.

PAYLOAD_SECRET - used by Payload to sign secrets like JWT tokens

## Quick Start - local setup

To spin up this template locally, follow these steps:

### Clone

After you click the `Deploy` button above, you'll want to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

### Development

1. First [clone the repo](#clone) if you have not done so already
2. `cd my-project && cp .env.example .env` to copy the example environment variables. You'll need to add the `MONGODB_URI` and `BLOB_READ_WRITE_TOKEN` from your Vercel project to your `.env` if you want to use Vercel Blob and the Neon database that was created for you.

3. `pnpm install && pnpm dev` to install dependencies and start the dev server
4. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

#### Docker (Optional)

If you prefer to use Docker for local development instead of a local MongoDB instance, the provided docker-compose.yml file can be used.

To do so, follow these steps:

- Modify the `MONGODB_URI` in your `.env` file to `mongodb://127.0.0.1/<dbname>`
- Modify the `docker-compose.yml` file's `MONGODB_URI` to match the above `<dbname>`
- Run `docker-compose up` to start the database, optionally pass `-d` to run in the background.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Media

  This is the uploads enabled collection. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
