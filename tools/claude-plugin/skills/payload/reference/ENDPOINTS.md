# Payload Custom API Endpoints Reference

Custom REST API endpoints extend Payload's auto-generated CRUD operations with custom logic, authentication flows, webhooks, and integrations.

## Quick Reference

### Endpoint Configuration

| Property  | Type                                              | Description                                                     |
| --------- | ------------------------------------------------- | --------------------------------------------------------------- |
| `path`    | `string`                                          | Route path after collection/global slug (e.g., `/:id/tracking`) |
| `method`  | `'get' \| 'post' \| 'put' \| 'patch' \| 'delete'` | HTTP method (lowercase)                                         |
| `handler` | `(req: PayloadRequest) => Promise<Response>`      | Async function returning Web API Response                       |
| `custom`  | `Record<string, any>`                             | Extension point for plugins/metadata                            |

### Request Context

| Property          | Type                    | Description                                            |
| ----------------- | ----------------------- | ------------------------------------------------------ |
| `req.user`        | `User \| null`          | Authenticated user (null if not authenticated)         |
| `req.payload`     | `Payload`               | Payload instance for operations (find, create...)      |
| `req.routeParams` | `Record<string, any>`   | Path parameters (e.g., `:id`)                          |
| `req.url`         | `string`                | Full request URL                                       |
| `req.method`      | `string`                | HTTP method                                            |
| `req.headers`     | `Headers`               | Request headers                                        |
| `req.json()`      | `() => Promise<any>`    | Parse JSON body                                        |
| `req.text()`      | `() => Promise<string>` | Read body as text                                      |
| `req.data`        | `any`                   | Parsed body (after `addDataAndFileToRequest()`)        |
| `req.file`        | `File`                  | Uploaded file (after `addDataAndFileToRequest()`)      |
| `req.locale`      | `string`                | Request locale (after `addLocalesToRequestFromData()`) |
| `req.i18n`        | `I18n`                  | i18n instance                                          |
| `req.t`           | `TFunction`             | Translation function                                   |

## Common Patterns

### Authentication Check

Custom endpoints are **not authenticated by default**. Check `req.user` to enforce authentication.

```ts
import { APIError } from 'payload'

export const authenticatedEndpoint = {
  path: '/protected',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    // User is authenticated
    return Response.json({ message: 'Access granted' })
  },
}
```

### Using Payload Operations

Use `req.payload` for database operations with access control and hooks.

```ts
export const getRelatedPosts = {
  path: '/:id/related',
  method: 'get',
  handler: async (req) => {
    const { id } = req.routeParams

    // Find related posts
    const posts = await req.payload.find({
      collection: 'posts',
      where: {
        category: {
          equals: id,
        },
      },
      limit: 5,
      sort: '-createdAt',
    })

    return Response.json(posts)
  },
}
```

### Route Parameters

Access path parameters via `req.routeParams`.

```ts
export const getTrackingEndpoint = {
  path: '/:id/tracking',
  method: 'get',
  handler: async (req) => {
    const orderId = req.routeParams.id

    const tracking = await getTrackingInfo(orderId)

    if (!tracking) {
      return Response.json({ error: 'not found' }, { status: 404 })
    }

    return Response.json(tracking)
  },
}
```

### Request Body Handling

**Option 1: Manual JSON parsing**

```ts
export const createEndpoint = {
  path: '/create',
  method: 'post',
  handler: async (req) => {
    const data = await req.json()

    const result = await req.payload.create({
      collection: 'posts',
      data,
    })

    return Response.json(result)
  },
}
```

**Option 2: Using helper (handles JSON + files)**

```ts
import { addDataAndFileToRequest } from 'payload'

export const uploadEndpoint = {
  path: '/upload',
  method: 'post',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    // req.data now contains parsed body
    // req.file contains uploaded file (if multipart)

    const result = await req.payload.create({
      collection: 'media',
      data: req.data,
      file: req.file,
    })

    return Response.json(result)
  },
}
```

### CORS Headers

Use `headersWithCors` helper to apply config CORS settings.

```ts
import { headersWithCors } from 'payload'

export const corsEndpoint = {
  path: '/public-data',
  method: 'get',
  handler: async (req) => {
    const data = await fetchPublicData()

    return Response.json(data, {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
    })
  },
}
```

### Error Handling

Throw `APIError` with status codes for proper error responses.

```ts
import { APIError } from 'payload'

export const validateEndpoint = {
  path: '/validate',
  method: 'post',
  handler: async (req) => {
    const data = await req.json()

    if (!data.email) {
      throw new APIError('Email is required', 400)
    }

    // Validation passed
    return Response.json({ valid: true })
  },
}
```

### Query Parameters

Extract query params from URL.

```ts
export const searchEndpoint = {
  path: '/search',
  method: 'get',
  handler: async (req) => {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const results = await req.payload.find({
      collection: 'posts',
      where: {
        title: {
          contains: query,
        },
      },
      limit,
    })

    return Response.json(results)
  },
}
```

## Helper Functions

### addDataAndFileToRequest

Parses request body and attaches to `req.data` and `req.file`.

```ts
import { addDataAndFileToRequest } from 'payload'

export const endpoint = {
  path: '/process',
  method: 'post',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    // req.data: parsed JSON or form data
    // req.file: uploaded file (if multipart)

    console.log(req.data) // { title: 'My Post' }
    console.log(req.file) // File object or undefined
  },
}
```

**Handles:**

- JSON bodies (`Content-Type: application/json`)
- Form data (`Content-Type: multipart/form-data`)
- File uploads

### addLocalesToRequestFromData

Extracts locale from request data and validates against config.

```ts
import { addLocalesToRequestFromData } from 'payload'

export const endpoint = {
  path: '/translate',
  method: 'post',
  handler: async (req) => {
    await addLocalesToRequestFromData(req)

    // req.locale: validated locale string
    // req.fallbackLocale: fallback locale string

    const result = await req.payload.find({
      collection: 'posts',
      locale: req.locale,
    })

    return Response.json(result)
  },
}
```

### headersWithCors

Applies CORS headers from Payload config.

```ts
import { headersWithCors } from 'payload'

export const endpoint = {
  path: '/data',
  method: 'get',
  handler: async (req) => {
    const data = { message: 'Hello' }

    return Response.json(data, {
      headers: headersWithCors({
        headers: new Headers({
          'Cache-Control': 'public, max-age=3600',
        }),
        req,
      }),
    })
  },
}
```

## Real-World Examples

### Multi-Tenant Login Endpoint

From `examples/multi-tenant`:

```ts
import { APIError, generatePayloadCookie, headersWithCors } from 'payload'

export const externalUsersLogin = {
  path: '/login-external',
  method: 'post',
  handler: async (req) => {
    const { email, password, tenant } = await req.json()

    if (!email || !password || !tenant) {
      throw new APIError('Missing credentials', 400)
    }

    // Find user with tenant constraint
    const userQuery = await req.payload.find({
      collection: 'users',
      where: {
        and: [
          { email: { equals: email } },
          {
            or: [{ tenants: { equals: tenant } }, { 'tenants.tenant': { equals: tenant } }],
          },
        ],
      },
    })

    if (!userQuery.docs.length) {
      throw new APIError('Invalid credentials', 401)
    }

    // Authenticate user
    const result = await req.payload.login({
      collection: 'users',
      data: { email, password },
    })

    return Response.json(result, {
      headers: headersWithCors({
        headers: new Headers({
          'Set-Cookie': generatePayloadCookie({
            collectionAuthConfig: req.payload.config.collections.find((c) => c.slug === 'users')
              .auth,
            cookiePrefix: req.payload.config.cookiePrefix,
            token: result.token,
          }),
        }),
        req,
      }),
    })
  },
}
```

### Webhook Handler (Stripe)

From `packages/plugin-ecommerce`:

```ts
export const webhookEndpoint = {
  path: '/webhooks',
  method: 'post',
  handler: async (req) => {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    try {
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

      // Process event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(req.payload, event.data.object)
          break
        case 'payment_intent.failed':
          await handlePaymentFailure(req.payload, event.data.object)
          break
      }

      return Response.json({ received: true })
    } catch (err) {
      req.payload.logger.error(`Webhook error: ${err.message}`)
      return Response.json({ error: err.message }, { status: 400 })
    }
  },
}
```

### Data Preview Endpoint

From `packages/plugin-import-export`:

```ts
import { addDataAndFileToRequest } from 'payload'

export const previewEndpoint = {
  path: '/preview',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    await addDataAndFileToRequest(req)

    const { collection, where, limit = 10 } = req.data

    // Validate collection exists
    const collectionConfig = req.payload.config.collections.find((c) => c.slug === collection)
    if (!collectionConfig) {
      throw new APIError('Collection not found', 404)
    }

    // Preview data
    const results = await req.payload.find({
      collection,
      where,
      limit,
      depth: 0,
    })

    return Response.json({
      docs: results.docs,
      totalDocs: results.totalDocs,
      fields: collectionConfig.fields,
    })
  },
}
```

### Reindex Action Endpoint

From `packages/plugin-search`:

```ts
export const reindexEndpoint = (pluginConfig) => ({
  path: '/reindex',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const { collection } = req.routeParams

    // Reindex collection
    const result = await reindexCollection(req.payload, collection, pluginConfig)

    return Response.json({
      message: `Reindexed ${result.count} documents`,
      count: result.count,
    })
  },
})
```

## Endpoint Placement

### Collection Endpoints

Mounted at `/api/{collection-slug}/{path}`.

```ts
import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  fields: [
    /* ... */
  ],
  endpoints: [
    {
      path: '/:id/tracking',
      method: 'get',
      handler: async (req) => {
        // Available at: /api/orders/:id/tracking
        const orderId = req.routeParams.id
        return Response.json({ orderId })
      },
    },
  ],
}
```

### Global Endpoints

Mounted at `/api/globals/{global-slug}/{path}`.

```ts
import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  fields: [
    /* ... */
  ],
  endpoints: [
    {
      path: '/clear-cache',
      method: 'post',
      handler: async (req) => {
        // Available at: /api/globals/settings/clear-cache
        await clearCache()
        return Response.json({ message: 'Cache cleared' })
      },
    },
  ],
}
```

## Advanced Patterns

### Factory Functions

Create reusable endpoint factories for plugins.

```ts
export const createWebhookEndpoint = (config) => ({
  path: '/webhook',
  method: 'post',
  handler: async (req) => {
    const signature = req.headers.get('x-webhook-signature')

    if (!verifySignature(signature, config.secret)) {
      throw new APIError('Invalid signature', 401)
    }

    const data = await req.json()
    await processWebhook(req.payload, data, config)

    return Response.json({ received: true })
  },
})
```

### Conditional Endpoints

Add endpoints based on config options.

```ts
export const MyCollection: CollectionConfig = {
  slug: 'posts',
  fields: [
    /* ... */
  ],
  endpoints: [
    // Always included
    {
      path: '/public',
      method: 'get',
      handler: async (req) => Response.json({ data: [] }),
    },
    // Conditionally included
    ...(process.env.ENABLE_ANALYTICS
      ? [
          {
            path: '/analytics',
            method: 'get',
            handler: async (req) => Response.json({ analytics: [] }),
          },
        ]
      : []),
  ],
}
```

### OpenAPI Documentation

Use `custom` property for API documentation metadata.

```ts
export const endpoint = {
  path: '/search',
  method: 'get',
  handler: async (req) => {
    // Handler implementation
  },
  custom: {
    openapi: {
      summary: 'Search posts',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Search results',
          content: {
            'application/json': {
              schema: { type: 'array' },
            },
          },
        },
      },
    },
  },
}
```

## Best Practices

1. **Always check authentication** - Custom endpoints are not authenticated by default
2. **Use `req.payload` for operations** - Ensures access control and hooks execute
3. **Use helpers for common tasks** - `addDataAndFileToRequest`, `headersWithCors`, etc.
4. **Throw `APIError` for errors** - Provides consistent error responses
5. **Return Web API `Response`** - Use `Response.json()` for consistent responses
6. **Validate input** - Check required fields, validate types
7. **Handle CORS** - Use `headersWithCors` for cross-origin requests
8. **Log errors** - Use `req.payload.logger` for debugging
9. **Document with `custom`** - Add OpenAPI metadata for API docs
10. **Factory pattern for reuse** - Create endpoint factories for plugins

## Resources

- REST API Overview: <https://payloadcms.com/docs/rest-api/overview>
- Custom Endpoints: <https://payloadcms.com/docs/rest-api/overview#custom-endpoints>
- Access Control: <https://payloadcms.com/docs/access-control/overview>
- Local API: <https://payloadcms.com/docs/local-api/overview>
