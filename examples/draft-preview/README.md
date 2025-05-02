# Payload Draft Preview Example

The [Payload Draft Preview Example](https://github.com/payloadcms/payload/tree/main/examples/draft-preview/payload) demonstrates how to implement [Draft Preview](https://payloadcms.com/docs/admin/preview#draft-preview) in [Payload](https://github.com/payloadcms/payload) using [Versions](https://payloadcms.com/docs/versions/overview) and [Drafts](https://payloadcms.com/docs/versions/drafts). With Draft Preview, you can navigate to your front-end application and enter "draft mode", where your queries are modified to fetch draft content instead of published content. This is useful for seeing how your content will look before being published.

## Quick Start

To spin up this example locally, follow these steps:

1. Run the following command to create a project from the example:

- `npx create-payload-app --example draft-preview`

2. `cp .env.example .env` to copy the example environment variables
3. `pnpm dev`, `yarn dev` or `npm run dev` to start the server
4. `open http://localhost:3000/admin` to access the admin panel
5. Login with email `demo@payloadcms.com` and password `demo`

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.

## How it works

Draft preview works by sending the user to your front-end with a `secret` along with their http-only cookies. Your front-end catches the request, verifies the authenticity, then enters into it's own preview mode. Once in preview mode, your front-end can begin securely requesting draft documents from Payload. See [Preview Mode](#preview-mode) for more details.

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend any of this functionality.

- #### Users

  The `users` collection is auth-enabled which provides access to the admin panel. When previewing documents on your front-end, the user's JWT is used to authenticate the request. See [Pages](#pages) for more details.

  For additional help with authentication, see the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs or the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth).

- #### Pages

  The `pages` collection is draft-enabled and has access control that restricts public users from viewing pages with a `_status` of `draft`. To fetch draft documents on your front-end, simply include the `draft=true` query param along with the `Authorization` header once you have entered [Preview Mode](#preview-mode).

  ```ts
  const preview = true // set this based on your own front-end environment (see `Preview Mode` below)
  const pageSlug = 'example-page' // same here
  const searchParams = `?where[slug][equals]=${pageSlug}&depth=1${preview ? `&draft=true` : ''}`

  // when previewing, send the payload token to bypass draft access control
  const pageReq = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages${searchParams}`, {
    headers: {
      ...(preview
        ? {
            Authorization: `JWT ${payloadToken}`,
          }
        : {}),
    },
  })
  ```

  For more details on how to extend this functionality, see the [Authentication](https://payloadcms.com/docs/authentication/overview) docs.

### Preview Mode

To preview draft documents, the user first needs to have at least one draft document saved. When they click the "preview" button from the Payload admin panel, a custom [preview function](https://payloadcms.com/docs/admin/collections#preview) routes them to your front-end with a `secret` along with their http-only cookies. An API route on your front-end will verify the secret and token before entering into it's own preview mode. Once in preview mode, it can begin requesting drafts from Payload using the `Authorization` header. See [Pages](#pages) for more details.

> "Preview mode" can vary between frameworks. In the Next.js App Router, [Draft Mode](https://nextjs.org/docs/pages/building-your-application/configuring/draft-mode) enables you to work with previewable content. It provides methods to set cookies in your browser, ensuring content is displayed as a draft, but this behavior might differ in other frameworks.

### On-demand Revalidation

If your front-end is statically generated then you may also want to regenerate the HTML for each page individually as they are published, referred to as On-demand Revalidation. This will prevent your static site from having to fully rebuild every page in order to deploy content changes. To do this, we add an `afterChange` hook to the collection that fires a request to your front-end in the background each time the document is updated. You can handle this request on your front-end to revalidate the HTML for your page.

> On-demand revalidation can vary between frameworks. In the Next.js [App Router](https://nextjs.org/docs/app/building-your-application/data-fetching/revalidating#on-demand-revalidation), on-demand revalidation allows you to regenerate the HTML for specific pages as needed. However, this behavior may differ in other frameworks.

### Admin Bar

You might also want to render an admin bar on your front-end so that logged-in users can quickly navigate between the front-end and Payload as they're editing. For React apps, check out the official [Payload Admin Bar](https://github.com/payloadcms/payload/tree/main/packages/admin-bar). For other frameworks, simply hit the `/me` route with `credentials: 'include'` and render your own admin bar if the user is logged in.

### CORS

The [`cors`](https://payloadcms.com/docs/production/preventing-abuse#cross-origin-resource-sharing-cors), [`csrf`](https://payloadcms.com/docs/production/preventing-abuse#cross-site-request-forgery-csrf), and [`cookies`](https://payloadcms.com/docs/authentication/overview#options) settings are configured to ensure that the admin panel and front-end can communicate with each other securely. If you are combining your front-end and admin panel into a single application that runs of a shared port and domain, you can simplify your config by removing these settings.

For more details on this, see the [CORS](https://payloadcms.com/docs/production/preventing-abuse#cross-origin-resource-sharing-cors) docs.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to scaffold a basic database for you to use as an example. You can remove `pnpm seed` from the `dev` script in the `package.json` to prevent this behavior. You can also freshly seed your project at any time by running `pnpm seed`. This seed creates a user with email `demo@payloadcms.com` and password `demo` along with a home page and an example page with two versions, one published and the other draft.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also choose to self-host your app, check out the [Deployment](https://payloadcms.com/docs/production/deployment) docs for more details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
