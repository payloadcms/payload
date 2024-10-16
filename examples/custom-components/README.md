# Payload Custom Components Example

This example demonstrates how to use Custom Components in [Payload](https://github.com/payloadcms/payload) Admin Panel. This example includes custom components for every field type available in Payload, including both server and client components. It also includes custom views, custom nav links, and more.

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

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend any of this functionality.

- #### Users

  The `users` collection is auth-enabled which provides access to the admin panel.

  For additional help with authentication, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth/cms#readme) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Fields

  The `fields` collection contains every field type available in Payload, each with custom components filled in every available "slot", i.e. `admin.components.Field`, `admin.components.Label`, etc. There are two of every field, one for server components, and the other for client components. This pattern shows how to use custom components in both environments, no matter which field type you are using.

- #### Views

  The `views` collection demonstrates how to add collection-level views, including the default view and custom tabs.

- #### Root Views

  The `root-views` collection demonstrates how to add a root document-level view to the admin panel.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
