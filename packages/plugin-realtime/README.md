# PayloadQuery

Currently you can stream DB updates to the client using a polling strategy (refetching at intervals). For example, to get the number of posts with react-query:

```ts
const { data, error, isLoading } = useQuery({
  queryKey: ['postsCount'],
  queryFn: () => fetch('/api/posts/count').then((res) => res.json()),
  refetchInterval: 5000, // refetch every 5 seconds
})
```

This has some problems:

1. It's not really "real-time". You have to wait for the refetch interval to be met.
2. It is not efficient, since even if nothing changed, it will make unnecessary requests.
3. It is not type-safe.

To solve these problems, we are introducing `payloadQuery`.

To use it in React, you need to wrap your app with `PayloadQueryClientProvider`:

```ts
import { PayloadQueryClientProvider } from '@payloadcms/plugin-realtime'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <PayloadQueryClientProvider>
      {children}
    </PayloadQueryClientProvider>
  )
}
```

Now you can use the `usePayloadQuery` hook anywhere in your app:

```ts
import { usePayloadQuery } from '@payloadcms/plugin-realtime'

const { data, error, isLoading } = usePayloadQuery('count', { collection: 'posts' })
```

This will automatically update the data when the DB changes!

You can use all 3 Local API reading methods: `find`, `findById`, and `count` (with all their possible parameters: where clauses, pagination, etc.).

## How it works

Under the hood, `PayloadQueryClientProvider` opens a single centralized connection that is kept alive, and is used to listen and receive updates via Server Sent Events (SSE). The initial request is made with a normal HTTP request that does not require keep-alive.

The same queries are cached on the client and server, so as not to repeat them unnecessarily.

On the server, the `afterChange` and `afterDelete` hooks are used to loop through all registered queries and fire them if they have been invalidated. Invalidation logic allows for incremental improvements. Instead of naively invalidating all queries for any change in the database, we can analyze the type of operation, the collection, or options such as the where clause.

# What if I don't use React?

This plugin was intentionally made framework-agnostic, in vanilla javascript:

```ts
import { createPayloadClient } from '@payloadcms/plugin-realtime'

const { payloadQuery } = createPayloadClient()

const initialCount = await payloadQuery(
  'count',
  { collection: 'posts' },
  {
    onChange: (result) => {
      if (result.data) {
        console.log(result.data.totalDocs) // do something with the result
      }
    },
  },
)
```

The React version is just a small wrapper around these functions. Feel free to bind it to your UI framework of choice!

## What if I use Vercel / Serverless?

Serverless platforms like Vercel don't allow indefinitely alive connections (either HTTP or websockets).

This API has a reconnection logic that can solve some problems, but even then when the server reconnects the queries stored in memory would be lost, so the client might miss some updates.

We want to explore later how to solve this, either by storing it in the payload database or in some external service or server.

## TODO

- [ ] Discuss overall strategy and API (this is a very primitive PoC yet)
- [ ] Add tests
- [ ] Add docs
- [ ] Make it fully type-safe. Currently the parameter options are type-safe depending on the method chosen (`find`, `findById` or `count`). But I would like to make the responses type-safe as well, like in an ORM. My idea is to pass an auto-generated parser to the `ClientProvider` that follows the collections interface.
- [ ] To be discussed: Currently this is a plugin. I think it would make sense to move the vanilla implementation to core and the react hook to the `/ui` package.
- [ ] Provide similar methods or hooks for type-safe mutations
- [ ] Reliability in serverless. Store in our own DB, or an external service or server?
- [ ] Our intention is to do much more in the realtime domain, such as showing who is editing a document in the admin panel. We would have to decide what name we want to give to this API that is a part of that broader umbrella. I am currently using the term `PayloadQuery` because of the similarity to react-query, but it actually does quite a bit more than react-query. There are many related terms that come to mind: `RCP`, `ORM`, `real-time`, `reactive`, etc.
