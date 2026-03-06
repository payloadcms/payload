---
title: Custom Endpoints
description: Custom REST API endpoints with authentication and helpers
tags: [payload, endpoints, api, routes, webhooks]
---

# Payload Custom Endpoints

## Basic Endpoint Pattern

Custom endpoints are **not authenticated by default**. Always check `req.user`.

```typescript
import { APIError } from 'payload'
import type { Endpoint } from 'payload'

export const protectedEndpoint: Endpoint = {
  path: '/protected',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    // Use req.payload for database operations
    const data = await req.payload.find({
      collection: 'posts',
      where: { author: { equals: req.user.id } },
    })

    return Response.json(data)
  },
}
```

## Route Parameters

```typescript
export const trackingEndpoint: Endpoint = {
  path: '/:id/tracking',
  method: 'get',
  handler: async (req) => {
    const { id } = req.routeParams

    const tracking = await getTrackingInfo(id)

    if (!tracking) {
      return Response.json({ error: 'not found' }, { status: 404 })
    }

    return Response.json(tracking)
  },
}
```

## Request Body Handling

```typescript
// Manual JSON parsing
export const createEndpoint: Endpoint = {
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

// Using helper (handles JSON + files)
import { addDataAndFileToRequest } from 'payload'

export const uploadEndpoint: Endpoint = {
  path: '/upload',
  method: 'post',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    // req.data contains parsed body
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

## Query Parameters

```typescript
export const searchEndpoint: Endpoint = {
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

## CORS Headers

```typescript
import { headersWithCors } from 'payload'

export const corsEndpoint: Endpoint = {
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

## Error Handling

```typescript
import { APIError } from 'payload'

export const validateEndpoint: Endpoint = {
  path: '/validate',
  method: 'post',
  handler: async (req) => {
    const data = await req.json()

    if (!data.email) {
      throw new APIError('Email is required', 400)
    }

    return Response.json({ valid: true })
  },
}
```

## Endpoint Placement

### Collection Endpoints

Mounted at `/api/{collection-slug}/{path}`.

```typescript
export const Orders: CollectionConfig = {
  slug: 'orders',
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

```typescript
export const Settings: GlobalConfig = {
  slug: 'settings',
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

### Root Endpoints

Mounted at `/api/{path}`.

```typescript
export default buildConfig({
  endpoints: [
    {
      path: '/hello',
      method: 'get',
      handler: () => {
        // Available at: /api/hello
        return Response.json({ message: 'Hello!' })
      },
    },
  ],
})
```

## Best Practices

1. **Always check authentication** - Custom endpoints are not authenticated by default
2. **Use `req.payload` for operations** - Ensures access control and hooks execute
3. **Use helpers for common tasks** - `addDataAndFileToRequest`, `headersWithCors`
4. **Throw `APIError` for errors** - Provides consistent error responses
5. **Return Web API `Response`** - Use `Response.json()` for consistent responses
6. **Validate input** - Check required fields, validate types
7. **Log errors** - Use `req.payload.logger` for debugging
