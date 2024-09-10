# Payload Custom Fields Example

This example demonstrates how to use Custom Fields in [Payload](https://github.com/payloadcms/payload).

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
1. `cd` into this directory and run `pnpm i --ignore-workspace`\*, `yarn`, or `npm install`

   > \*If you are running using pnpm within the Payload Monorepo, the `--ignore-workspace` flag is needed so that pnpm generates a lockfile in this example's directory despite the fact that one exists in root.

1. `pnpm dev`, `yarn dev` or `npm run dev` to start the server
   - Press `y` when prompted to seed the database
1. `open http://localhost:3000` to access the home page
1. `open http://localhost:3000/admin` to access the admin panel
   - Login with email `demo@payloadcms.com` and password `demo`

## How it works

TODO: write this section

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend any of this functionality.

- #### Users

  The `users` collection is auth-enabled which provides access to the admin panel. When previewing documents on your front-end, the user's JWT is used to authenticate the request. See [Pages](#pages) for more details.

  For additional help with authentication, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth/cms#readme) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Pages

  Each page is assigned a `tenant` which is used to control access and scope API requests. Pages that are created by tenants are automatically assigned that tenant based on that user's `lastLoggedInTenant` field.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
