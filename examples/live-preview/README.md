# Payload Live Preview Example

The [Payload Live Preview Example](https://github.com/payloadcms/payload/tree/main/examples/live-preview) demonstrates how to implement [Live Preview](https://payloadcms.com/docs/live-preview/overview) in [Payload](https://github.com/payloadcms/payload). With Live Preview you can render your front-end application directly within the Admin panel. As you type, your changes take effect in real-time. No need to save a draft or publish your changes.

**IMPORTANT—This example includes a fully integrated Next.js App Router front-end that runs on the same server as Payload.**

## Quick Start

1. Run the following command to create a project from the example:

- `npx create-payload-app --example live-preview`

2. `cp .env.example .env` to copy the example environment variables

3. `pnpm dev`, `yarn dev` or `npm run dev` to start the server
   - Press `y` when prompted to seed the database
4. `open http://localhost:3000` to access the home page
5. `open http://localhost:3000/admin` to access the admin panel
   - Login with email `demo@payloadcms.com` and password `demo`

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

There are two ways to use Live Preview in your own application depending on whether your front-end framework supports server components:

- [Server-side Live Preview (suggested)](#server)
- [Client-side Live Preview](#client)

<Banner type="info">
  We suggest using server-side Live Preview if your framework supports it, it is both simpler to setup and more performant to run than the client-side alternative.
</Banner>

### Server

> Server-side Live Preview is only for front-end frameworks that support the concept of Server Components, i.e. [React Server Components](https://react.dev/reference/rsc/server-components). If your front-end application is built with a client-side framework like the [Next.js Pages Router](https://nextjs.org/docs/pages), [React Router](https://reactrouter.com), [Vue 3](https://vuejs.org), etc., see [client-side Live Preview](#client).

Server-side Live Preview works by making a roundtrip to the server every time your document is saved, i.e. draft save, autosave, or publish. While using Live Preview, the Admin panel emits a new `window.postMessage` event which your front-end application can use to invoke this process. In Next.js, this means simply calling `router.refresh()` which will hydrate the HTML using new data straight from the [Local API](../local-api/overview).

If your server-side front-end application is built with [React](#react), you can use the `RefreshRouteOnChange` function that Payload provides. In the future, all other major frameworks like Vue and Svelte will be officially supported. If you are using any of these frameworks today, you can still integrate with Live Preview yourself using the underlying tooling that Payload provides. See [building your own router refresh component](https://payloadcms.com/docs/live-preview/server#building-your-own-router-refresh-component) for more information.

#### React

If your front-end application is built with server-side [React](https://react.dev), i.e. [Next.js App Router](https://nextjs.org/docs/app), you can use the `RefreshRouteOnSave` component that Payload provides and thread it your framework's refresh function.

First, install the `@payloadcms/live-preview-react` package:

```bash
npm install @payloadcms/live-preview-react
```

Then, render `RefreshRouteOnSave` anywhere in your `page.tsx`. Here's an example:

`page.tsx`:

```tsx
import { RefreshRouteOnSave } from './RefreshRouteOnSave.tsx'
import { getPayload } from 'payload'
import config from '../payload.config'

export default async function Page() {
  const payload = await getPayload({ config })

  const page = await payload.find({
    collection: 'pages',
    draft: true,
  })

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <h1>{page.title}</h1>
    </Fragment>
  )
}
```

`RefreshRouteOnSave.tsx`:

```tsx
'use client'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation.js'
import React from 'react'

export const RefreshRouteOnSave: React.FC = () => {
  const router = useRouter()
  return <PayloadLivePreview refresh={router.refresh} serverURL={process.env.PAYLOAD_SERVER_URL} />
}
```

For more details on how to setup server-side Live Preview, see the [server-side Live Preview](https://payloadcms.com/docs/live-preview/server) docs.

### Client

> If your front-end application is supports Server Components like the [Next.js App Router](https://nextjs.org/docs/app), etc., we suggest setting up [server-side Live Preview](#server).

#### React

If your front-end application is built with client-side React such as Next.js Pages Router, React Router, etc., use the [`useLivePreview`](#react) React hook that Payload provides.

First, install the `@payloadcms/live-preview-react` package:

```bash
npm install @payloadcms/live-preview-react
```

Then, use the `useLivePreview` hook in your React component:

```tsx
'use client'
import { useLivePreview } from '@payloadcms/live-preview-react'
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

  return <h1>{data.title}</h1>
}
```

#### JavaScript

In the future, all other major frameworks like Vue, Svelte, etc will be officially supported. If you are using any of these framework today, you can still integrate with Live Preview yourself using the tooling that Payload provides.

First, install the `@payloadcms/live-preview` package:

```bash
npm install @payloadcms/live-preview
```

Then, build your own hook:

```tsx
import { subscribe, unsubscribe } from '@payloadcms/live-preview'

// Build your own hook to subscribe to the live preview events
// This function will handle everything for you like
// 1. subscribing to `window.postMessage` events
// 2. merging initial page data with incoming form state
// 3. populating relationships and uploads
```

See [building your own Live Preview hook](https://payloadcms.com/docs/live-preview/frontend#building-your-own-hook) for more details.

For more details on how to setup client-side Live Preview, see the [client-side Live Preview](https://payloadcms.com/docs/live-preview/client) docs.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to scaffold a basic database for you to use as an example. You can remove `pnpm seed` from the `dev` script in the `package.json` to prevent this behavior. You can also freshly seed your project at any time by running `pnpm seed`. This seed creates a user with email `demo@payloadcms.com` and password `demo` along with a home page and an example page with two versions, one published and the other draft.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also choose to self-host your app, check out the [Deployment](https://payloadcms.com/docs/production/deployment) docs for more details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
