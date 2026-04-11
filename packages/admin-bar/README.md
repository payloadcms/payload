# Payload Admin Bar

An admin bar for React apps using [Payload](https://github.com/payloadcms/payload).

### Installation

```bash
pnpm i @payloadcms/admin-bar
```

### Basic Usage

```jsx
import { PayloadAdminBar } from '@payloadcms/admin-bar'

export const App = () => {
  return <PayloadAdminBar cmsURL="https://cms.website.com" collection="pages" id="12345" />
}
```

Checks for authentication with Payload CMS by hitting the [`/me`](https://payloadcms.com/docs/authentication/operations#me) route. If authenticated, renders an admin bar with simple controls to do the following:

- Navigate to the admin dashboard
- Navigate to the currently logged-in user's account
- Edit the current collection
- Create a new collection of the same type
- Logout
- Indicate and exit preview mode

The admin bar ships with very little style and is fully customizable.

### Dynamic props

With client-side routing, we need to update the admin bar with a new collection type and document id on each route change. This will depend on your app's specific setup, but here are a some common examples:

#### NextJS

For NextJS apps using dynamic-routes, use `getStaticProps`:

```ts
export const getStaticProps = async ({ params: { slug } }) => {
  const props = {}

  const pageReq = await fetch(
    `https://cms.website.com/api/pages?where[slug][equals]=${slug}&depth=1`,
  )
  const pageData = await pageReq.json()

  if (pageReq.ok) {
    const { docs } = pageData
    const [doc] = docs

    props = {
      ...doc,
      collection: 'pages',
      collectionLabels: {
        singular: 'page',
        plural: 'pages',
      },
    }
  }

  return props
}
```

Now your app can forward these props onto the admin bar. Something like this:

```ts
import { PayloadAdminBar } from '@payloadcms/admin-bar';

export const App = (appProps) => {
  const {
    pageProps: {
      collection,
      collectionLabels,
      id
    }
  } = appProps;

  return (
    <PayloadAdminBar
      {...{
        cmsURL: 'https://cms.website.com',
        collection,
        collectionLabels,
        id
      }}
    />
  )
}
```

### Props

| Property           | Type                                                                                                                     | Required | Default                 | Description                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cmsURL             | `string`                                                                                                                 | true     | `http://localhost:8000` | `serverURL` as defined in your [Payload config](https://payloadcms.com/docs/configuration/overview#options)                                                |
| adminPath          | `string`                                                                                                                 | false    | /admin                  | `routes` as defined in your [Payload config](https://payloadcms.com/docs/configuration/overview#options)                                                   |
| apiPath            | `string`                                                                                                                 | false    | /api                    | `routes` as defined in your [Payload config](https://payloadcms.com/docs/configuration/overview#options)                                                   |
| authCollectionSlug | `string`                                                                                                                 | false    | 'users'                 | Slug of your [auth collection](https://payloadcms.com/docs/configuration/collections)                                                                      |
| collectionSlug     | `string`                                                                                                                 | true     | undefined               | Slug of your [collection](https://payloadcms.com/docs/configuration/collections)                                                                           |
| collectionLabels   | `{ singular?: string, plural?: string }`                                                                                 | false    | undefined               | Labels of your [collection](https://payloadcms.com/docs/configuration/collections)                                                                         |
| id                 | `string`                                                                                                                 | true     | undefined               | id of the document                                                                                                                                         |
| logo               | `ReactElement`                                                                                                           | false    | undefined               | Custom logo                                                                                                                                                |
| classNames         | `{ logo?: string, user?: string, controls?: string, create?: string, logout?: string, edit?: string, preview?: string }` | false    | undefined               | Custom class names, one for each rendered element                                                                                                          |
| logoProps          | `{[key: string]?: unknown}`                                                                                              | false    | undefined               | Custom props                                                                                                                                               |
| userProps          | `{[key: string]?: unknown}`                                                                                              | false    | undefined               | Custom props                                                                                                                                               |
| divProps           | `{[key: string]?: unknown}`                                                                                              | false    | undefined               | Custom props                                                                                                                                               |
| createProps        | `{[key: string]?: unknown}`                                                                                              | false    | undefined               | Custom props                                                                                                                                               |
| logoutProps        | `{[key: string]?: unknown}`                                                                                              | false    | undefined               | Custom props                                                                                                                                               |
| editProps          | `{[key: string]?: unknown}`                                                                                              | false    | undefined               | Custom props                                                                                                                                               |
| previewProps       | `{[key: string]?: unknown}`                                                                                              | false    | undefined               | Custom props                                                                                                                                               |
| style              | `CSSProperties`                                                                                                          | false    | undefined               | Custom inline style                                                                                                                                        |
| unstyled           | `boolean`                                                                                                                | false    | undefined               | If true, renders no inline style                                                                                                                           |
| onAuthChange       | `(user: PayloadMeUser) => void`                                                                                          | false    | undefined               | Fired on each auth change                                                                                                                                  |
| devMode            | `boolean`                                                                                                                | false    | undefined               | If true, fakes authentication (useful when dealing with [SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)) |
| preview            | `boolean`                                                                                                                | false    | undefined               | If true, renders an exit button with your `onPreviewExit` handler)                                                                                         |
| onPreviewExit      | `function`                                                                                                               | false    | undefined               | Callback for the preview button `onClick` event)                                                                                                           |
