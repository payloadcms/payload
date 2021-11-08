# Payload Admin Bar

An React admin bar for apps using Payload CMS.

### Installation

```bash
$ npm i payload-admin-bar
$ # or
$ yarn add payload-admin-bar
```

### Basic Usage

```jsx
import { PayloadAdminBar } from 'payload-admin-bar';

export const App = () => {
  return (
    <PayloadAdminBar
      cmsURL="https://website.com"
      collection="pages"
      id="12345"
    />
  )
}
```

Checks for authentication with Payload CMS by hitting the [`/me`](https://payloadcms.com/docs/authentication/operations#me) route. On success, renders an admin bar with simple controls to navigate to the following:

- Admin dashboard
- User account
- Current collection
- New collection
- Logout

The admin bar ships with very little style and is fully customizable.

### Dynamic props

Client-side routing requires that we update the admin bar with fresh props on each route change. This will depend on your app's specific setup, but here are a some common examples:

#### NextJS

For NextJS apps using dynamic-routes, you may need to return the collection type from `getStaticProps`:

```
export const getStaticProps = async ({ params: { slug } }) => {
  const props = {};

  const pageReq = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${COLLECTION_NAME}?where[slug][equals]=${pageSlug}&depth=1`);
  const pageData = await pageReq.json();

  if (pageReq.ok) {
    const { docs } = pageData;
    const [doc] = docs;

    props = {
      ...doc,
      collection: 'COLLECTION_NAME',
      collectionLabels: {
        singular: 'SINGULAR_COLLECTION_LABEL',
        plural: 'PLURAL_COLLECTION_LABEL',
      }
    };
  }

  return props;
}
```

Now your app can forward these props onto the admin bar:

```
import { PayloadAdminBar } from 'payload-admin-bar';

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
        cmsURL: `${process.env.NEXT_PUBLIC_API_URL}`,
        collection,
        collectionLabels,
        id
      }}
    />
  )
}
```

### Props
Property | Type | Required | Default | Description
--- | --- | --- | ---  | ---
cmsURL | `string` | true | undefined | `serverURL` as defined in your [Payload config](https://payloadcms.com/docs/configuration/overview#options)
adminPath | `string` | false | /admin | `routes` as defined in your [Payload config](https://payloadcms.com/docs/configuration/overview#options)
apiPath | `string` | false | /api | `routes` as defined in your [Payload config](https://payloadcms.com/docs/configuration/overview#options)
collection | `string` | true | undefined | Slug of your [collection](https://payloadcms.com/docs/configuration/collections)
collectionLabels | `{ singular?: string, plural?: string }` | false | undefined | Labels of your [collection](https://payloadcms.com/docs/configuration/collections)
id | `string` | true | undefined | id of the document
logo | `ReactElement` | false | undefined | Custom logo
classNames | `{ logo?: string, user?: string, controls?: string, create?: string, logout?: string, edit?: string }` | false | undefined | Custom class names, one for each rendered element
logoProps | `{[key: string]?: unknown}` | false | undefined | Custom props
userProps | `{[key: string]?: unknown}` | false | undefined | Custom props
divProps | `{[key: string]?: unknown}` | false | undefined | Custom props
createProps | `{[key: string]?: unknown}` | false | undefined | Custom props
logoutProps | `{[key: string]?: unknown}` | false | undefined | Custom props
editProps | `{[key: string]?: unknown}` | false | undefined | Custom props
style | `CSSProperties` | false | undefined | Custom inline style
unstyled | `boolean` | false | undefined | If true, renders no inline style
onAuthChange | `(user: PayloadMeUser) => void` | false | undefined | Fired on each auth change
devMode | `boolean` | false | undefined | If true, fakes authentication (useful when dealing with [SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite))
