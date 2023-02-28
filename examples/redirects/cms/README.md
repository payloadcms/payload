# Redirects Example for Payload CMS

This example demonstrates how to implement http redirects into Payload CMS using the official [Redirects Plugin](https://github.com/payloadcms/plugin-redirects).

There is a fully working Next.js app tailored specifically for this example which can be found [here](../nextjs). Follow the instructions there to get started. If you are setting up redirects for another front-end, please consider contributing to this repo with your own example!

## Getting Started

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

### Seed

On boot, a seed script is included to create a user, a home page, and a the following redirects for you to test with:

- From `/redirect-to-external` to `https://payloadcms.com`
- From `/redirect-to-internal` to `/redirected`
