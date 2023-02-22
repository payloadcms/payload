# Preview Example for Payload CMS

This example demonstrates how to implement preview into Payload CMS using [Versions](https://payloadcms.com/docs/versions/overview) and [Drafts](https://payloadcms.com/docs/versions/drafts).

There is a fully working Next.js app tailored specifically for this example which can be found [here](../nextjs). Follow the instructions there to get started. If you are setting up preview for another front-end, please consider contributing to this repo with your own example!

## Getting Started

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:8000/admin` to access the admin panel
6. Login with email `dev@payloadcms.com` and password `test`

## How it works

A `pages` collection is created with `versions: { drafts: true }` and access control that restricts access to only logged-in users and `published` pages. On your front-end, a query similar to this can be used to fetch data and bypass access control in preview mode:

```ts
  const preview = true; // set this based on your own front-end environment (see `Preview Mode` below)
  const pageSlug = 'example-page'; // same here
  const searchParams = `?where[slug][equals]=${pageSlug}&depth=1${preview ? `&draft=true` : ''}`

  // when previewing, send the payload token to bypass draft access control
  const pageReq = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/pages${searchParams}`, {
    headers: {
      ...preview ? {
         Authorization: `JWT ${payloadToken}`,
      } : {},
    },
  })
```

The [`cors`](https://payloadcms.com/docs/production/preventing-abuse#cross-origin-resource-sharing-cors), [`csrf`](https://payloadcms.com/docs/production/preventing-abuse#cross-site-request-forgery-csrf), and [`cookies`](https://payloadcms.com/docs/authentication/config#options) settings are also configured to ensure that the admin panel and front-end can communicate with each other securely.

### Preview Mode

To enter preview mode we format a custom URL using a [preview function](https://payloadcms.com/docs/configuration/collections#preview) in the collection config. When a user clicks the "Preview" button, they are routed to this URL along with their http-only cookies and revalidation key. Your front-end can then use the `payload-token` and revalidation key to verify the request and enter into its own preview mode.

### Instant Static Regeneration (ISR)

If your front-end is statically generated then you may also want to regenerate the HTML for each page as they are published. To do this, we add an `afterChange` hook to the collection that fires a request to your front-end in the background each time the document is updated. You can handle this request on your front-end and regenerate the HTML for your page however needed.

### Seed

On boot, a seed script is included to create a user, a home page, and an example page with two versions, one published and one draft.
