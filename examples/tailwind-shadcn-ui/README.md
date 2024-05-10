# Payload with TailwindCSS and shadcn/ui

This is an example repo of Payload being setup with TailwindCSS and shadcn/ui components ready to be used in the admin panel itself.

Checkout our [tutorial](https://payloadcms.com/blog/how-to-setup-tailwindcss-and-shadcn-ui-in-payload) on our website

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
1. `cd` into this directory and run `pnpm i --ignore-workspace`\*, or `npm install`

   > \*If you are running using pnpm within the Payload Monorepo, the `--ignore-workspace` flag is needed so that pnpm generates a lockfile in this example's directory despite the fact that one exists in root.

1. `cp .env.example .env` to copy the example environment variables

   > Adjust `PAYLOAD_PUBLIC_SITE_URL` in the `.env` if your front-end is running on a separate domain or port.

1. `pnpm dev`, `yarn dev` or `npm run dev` to start the server
   - Press `y` when prompted to seed the database
1. `open http://localhost:3000` to access the home page
1. `open http://localhost:3000/admin` to access the admin panel

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.
