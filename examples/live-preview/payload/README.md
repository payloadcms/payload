# Payload Live Preview Example

The [Payload Live Preview Example](https://github.com/payloadcms/payload/tree/main/examples/live-preview/payload) demonstrates how to implement [Live Preview](https://payloadcms.com/docs/live-preview) in [Payload](https://github.com/payloadcms/payload). With Live Preview you can render your front-end application directly within the Admin panel. As you type, your changes take effect in real-time. No need to save a draft or publish your changes.

There are various fully working front-ends made explicitly for this example, including:

- [Next.js App Router](../next-app)
- [Next.js Pages Router](../next-pages)

Follow the instructions in each respective README to get started. If you are setting up Live Preview for another front-end, please consider contributing to this repo with your own example!

## Quick Start

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:3000/admin` to access the admin panel
6. Login with email `demo@payloadcms.com` and password `demo`

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.

## How it works

Live Preview works by rendering an iframe on the page that loads your front-end application. The Admin panel communicates with your app through `window.postMessage` events. These events are emitted every time a change is made to the document. Your app then listens for these events and re-renders itself with the data it receives.

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend any of this functionality.

- #### Users

  The `users` collection is auth-enabled which provides access to the admin panel. This is where your front-end application will be rendered with live page data. See [Pages](#pages) for more details.

  ```ts
  // ./src/collections/Users.ts
  {
    // ...
    auth: true
  }
  ```

  For additional help with authentication, see the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs or the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth).

- #### Pages

  The `pages` collection has Live Preview enabled through the `admin.livePreview` property of the `pages` collection config:

  ```ts
  // ./src/collections/Pages.ts
  {
    // ...
    admin: {
      livePreview: {
        url: ({ data }) => `${process.env.PAYLOAD_URL}/${data.slug}`
      }
    }
  }
  ```

  For more details on how to extend this functionality, see the [Live Preview](https://payloadcms.com/docs/live-preview) docs.

## Front-end

While using Live Preview, the Admin panel emits a new `window.postMessage` event every time a change is made to the document. Your front-end application can listen for these events and re-render accordingly.

### React

If your front-end application is built with React or Next.js, use the [`useLivePreview`](#react) React hook that Payload provides.

First, install the `@payloadcms/live-preview-react` package:

```bash
npm install @payloadcms/live-preview-react
```

Then, use the `useLivePreview` hook in your React component:

```tsx
'use client';
import { useLivePreview } from '@payloadcms/live-preview-react';
import { Page as PageType } from '@/payload-types'

// Fetch the page in a server component, pass it to the client component, then thread it through the hook
// The hook will take over from there and keep the preview in sync with the changes you make
// The `data` property will contain the live data of the document
export const PageClient: React.FC<{
  page: {
    title: string
  }
}> = ({ page: initialPage }) => {
  const { data } = useLivePreview<PageType>({
    initialData: initialPage,
    serverURL: PAYLOAD_SERVER_URL,
    depth: 2, // Ensure that the depth matches the request for `initialPage`
  })

  return (
    <h1>{data.title}</h1>
  )
}
```

### JavaScript

In the future, all other major frameworks like Vue, Svelte, etc will be officially supported. If you are using any of these framework today, you can still integrate with Live Preview yourself using the tooling that Payload provides.

First, install the `@payloadcms/live-preview` package:

```bash
npm install @payloadcms/live-preview
```

Then, build your own hook:

```tsx
import { subscribe, unsubscribe } from '@payloadcms/live-preview';

// Build your own hook to subscribe to the live preview events
// This function will handle everything for you like
// 1. subscribing to `window.postMessage` events
// 2. merging initial page data with incoming form state
// 3. populating relationships and uploads
```

See [building your own Live Preview hook](https://payloadcms.com/docs/live-preview/frontend#building-your-own-hook) for more details.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to scaffold a basic database for you to use as an example. This is done by setting the `PAYLOAD_DROP_DATABASE` and `PAYLOAD_PUBLIC_SEED` environment variables which are included in the `.env.example` by default. You can remove these from your `.env` to prevent this behavior. You can also freshly seed your project at any time by running `yarn seed`. This seed creates a user with email `demo@payloadcms.com` and password `demo` along with a home page.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also choose to self-host your app, check out the [Deployment](https://payloadcms.com/docs/production/deployment) docs for more details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
