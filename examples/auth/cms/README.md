# Payload Auth Example

This example demonstrates how to implement [Payload Authentication](https://payloadcms.com/docs/authentication/overview).

There is a fully working Next.js app made explicitly for this example which can be found [here](../nextjs). Follow the instructions there to get started. If you are setting up authentication for another front-end, please consider contributing to this repo with your own example!

## Quick Start

To spin up this example locally, follow these steps:

1. First clone the repo
1. Then `cd YOUR_PROJECT_REPO && cp .env.example .env`
1. Next `yarn && yarn dev`
1. Now `open http://localhost:8000/admin` to access the admin panel
1. Login with email `dev@payloadcms.com` and password `test`

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.

## How it works

The `users` collection exposes all [auth-related operations](https://payloadcms.com/docs/authentication/operations) needed to create a fully custom workflow on your front-end using the REST or GraphQL APIs, including:

- `Me`
- `Login`
- `Logout`
- `Refresh Token`
- `Verify Email`
- `Unlock`
- `Forgot Password`
- `Reset Password`

The [`cors`](https://payloadcms.com/docs/production/preventing-abuse#cross-origin-resource-sharing-cors), [`csrf`](https://payloadcms.com/docs/production/preventing-abuse#cross-site-request-forgery-csrf), and [`cookies`](https://payloadcms.com/docs/authentication/config#options) settings are also configured to ensure that the admin panel and front-end can communicate with each other securely.

### Access Control

Basic role-based access control is setup to determine what users can and cannot do based on their roles, which are:

- `admin`: They can access the Payload admin panel to manage your application. They can see all data and make all operations.
- `user`: They cannot access the Payload admin panel and have a limited access to operations based on their user.

A `beforeChange` field hook called `protectRoles` is placed on this to automatically populate `roles` with the `user` role when a new user is created. It also protects roles from being changed by non-admins.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to create a user with email `dev@payloadcms.com`, password `test`, the role `admin`.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).

