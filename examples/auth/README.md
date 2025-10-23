# Payload Auth Example

This [Payload Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) demonstrates how to implement [Payload Authentication](https://payloadcms.com/docs/authentication/overview) into all types of applications. Follow the [Quick Start](#quick-start) to get up and running quickly.

## Quick Start

To spin up this example locally, follow the steps below:

1. Run the following command to create a project from the example:

- `npx create-payload-app --example auth`

2. Start the server:
   - Depending on your package manager, run `pnpm dev`, `yarn dev` or `npm run dev`
   - When prompted, type `y` then `enter` to seed the database with sample data
3. Access the application:
   - Open your browser and navigate to `http://localhost:3000` to access the homepage.
   - Open `http://localhost:3000/admin` to access the admin panel.
4. Login:

- Use the following credentials to log into the admin panel:
  > `Email: demo@payloadcms.com` > `Password: demo`

## How it works

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled and encompass both admins and regular users based on the value of their `roles` field. Only `admin` users can access your admin panel to manage your content whereas `user` can authenticate on your front-end and access-controlled interfaces. See [Access Control](#access-control) for more details.

  **Local API**

  On the server, Payload provides all operations needed to authenticate users server-side using the Local API. In Next.js that might look something like this:

  ```ts
    import { headers as getHeaders } from 'next/headers.js'
    import { getPayload } from 'payload'
    import config from '../../payload.config'

    export default async function AccountPage({ searchParams }) {
      const headers = await getHeaders()
      const payload = await getPayload({ config: configPromise })
      const { permissions, user } = await payload.auth({ headers })

      if (!user) {
        redirect(
          `/login?error=${encodeURIComponent('You must be logged in to access your account.')}&redirect=/account`,
        )
      }

      return ...
    }
  ```

  **HTTP**

  The `users` collection also opens an http-layer to expose all [auth-related operations](https://payloadcms.com/docs/authentication/operations) through the REST and GraphQL APIs, including:

  - `Me`
  - `Login`
  - `Logout`
  - `Refresh Token`
  - `Verify Email`
  - `Unlock`
  - `Forgot Password`
  - `Reset Password`

  This might look something like this:

  ```ts
  await fetch('/api/users/me', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  ```

  > NOTE: You can still use the HTTP APIs on the server if you don't have access to the Local API.

### Security

The [`cors`](https://payloadcms.com/docs/production/preventing-abuse#cross-origin-resource-sharing-cors), [`csrf`](https://payloadcms.com/docs/production/preventing-abuse#cross-site-request-forgery-csrf), and [`cookies`](https://payloadcms.com/docs/authentication/overview#options) settings are all configured to ensure that the admin panel and front-end can communicate with each other securely.

For additional help, see the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

### Access Control

Basic role-based access control is setup to determine what users can and cannot do based on their roles, which are:

- `admin`: They can access the Payload admin panel to manage your application. They can see all data and make all operations.
- `user`: They cannot access the Payload admin panel and have a limited access to operations based on their user.

A `beforeChange` field hook called `protectRoles` is placed on this to automatically populate `roles` with the `user` role when a new user is created. It also protects roles from being changed by non-admins.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed migration performed to create a user with email `demo@payloadcms.com`, password `demo`, the role `admin`.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `pnpm build`, `yarn build`, or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `pnpm serve`, `yarn serve`, or `npm run serve` to run Node.js in production and serve Payload from the `./build` directory.

### Deployment

If you are using an integrated Next.js setup, the easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js. Otherwise, easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
