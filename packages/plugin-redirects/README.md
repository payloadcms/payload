# Payload Redirects Plugin

A plugin for [Payload](https://github.com/payloadcms/payload) to easily manage your redirects from within your admin panel.

## Features

- Manage redirects directly from your admin panel
- Support for internal (reference) and external (custom URL) redirects
- Built-in multi-language support
- Optional redirect types (301, 302, etc.)

## Installation

```bash
pnpm add @payloadcms/plugin-redirects
```

## Basic Usage

In your [Payload Config](https://payloadcms.com/docs/configuration/overview), add the plugin:

```ts
import { buildConfig } from 'payload'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

export default buildConfig({
  plugins: [
    redirectsPlugin({
      collections: ['pages'], // Collections to use in the 'to' relationship field
    }),
  ],
})
```

## Configuration

### Options

| Option                      | Type       | Description                                                                                             |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `collections`               | `string[]` | An array of collection slugs to populate in the `to` field of each redirect.                            |
| `overrides`                 | `object`   | A partial collection config that allows you to override anything on the `redirects` collection.         |
| `redirectTypes`             | `string[]` | Provide an array of redirects if you want to provide options for the type of redirects to be supported. |
| `redirectTypeFieldOverride` | `Field`    | A partial Field config that allows you to override the Redirect Type field if enabled above.            |

### Advanced Example

```ts
import { buildConfig } from 'payload'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

export default buildConfig({
  plugins: [
    redirectsPlugin({
      collections: ['pages', 'posts'],

      // Add custom redirect types
      redirectTypes: ['301', '302'],

      // Override the redirects collection
      overrides: {
        slug: 'custom-redirects',

        // Add custom fields
        fields: ({ defaultFields }) => {
          return [
            ...defaultFields,
            {
              name: 'notes',
              type: 'textarea',
              admin: {
                description: 'Internal notes about this redirect',
              },
            },
          ]
        },
      },
    }),
  ],
})
```

## Custom Translations

The plugin automatically includes translations for English, French, and Spanish. If you want to customize existing translations or add new languages, you can override them in your config:

```ts
import { buildConfig } from 'payload'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

export default buildConfig({
  i18n: {
    translations: {
      // Add your custom language
      de: {
        'plugin-redirects': {
          fromUrl: 'Von URL',
          toUrlType: 'Ziel-URL-Typ',
          internalLink: 'Interner Link',
          customUrl: 'Benutzerdefinierte URL',
          documentToRedirect: 'Dokument zum Weiterleiten',
          redirectType: 'Weiterleitungstyp',
        },
      },
      // Or override existing translations
      fr: {
        'plugin-redirects': {
          fromUrl: 'URL source', // Custom override
        },
      },
    },
  },

  plugins: [
    redirectsPlugin({
      collections: ['pages'],
    }),
  ],
})
```

## Using Redirects in Your Frontend

The plugin creates a `redirects` collection in your database. You can query this collection from your frontend and implement the redirects using your framework's routing system.

### Example: Next.js Middleware

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fetch redirects from Payload API
  const redirects = await fetch('http://localhost:3000/api/redirects', {
    next: { revalidate: 60 }, // Cache for 60 seconds
  }).then((res) => res.json())

  // Find matching redirect
  const redirect = redirects.docs?.find((r: any) => r.from === pathname)

  if (redirect) {
    const destination =
      redirect.to.type === 'reference'
        ? redirect.to.reference.slug // Adjust based on your collection structure
        : redirect.to.url

    return NextResponse.redirect(
      new URL(destination, request.url),
      redirect.type === '301' ? 301 : 302,
    )
  }

  return NextResponse.next()
}
```

## Links

- [Source code](https://github.com/payloadcms/payload/tree/main/packages/plugin-redirects)
- [Documentation](https://payloadcms.com/docs/plugins/redirects)
- [Issue tracker](https://github.com/payloadcms/payload/issues)
