# @payloadcms/plugin-graphql

GraphQL support for Payload, packaged as a plugin.

In Payload v4, GraphQL is opt-in. Projects that don't use GraphQL no longer ship the `graphql`, `graphql-http`, or `graphql-playground-html` dependencies, saving roughly 2.9 MB of installed footprint and meaningful cold-boot time on serverless deploys.

## Install

```sh
pnpm add @payloadcms/plugin-graphql graphql
```

`graphql` is a peer dependency — Payload doesn't pin its version so you can pick the one you want.

## Usage

```ts
// payload.config.ts
import { buildConfig } from 'payload'
import { graphQLPlugin } from '@payloadcms/plugin-graphql'

export default buildConfig({
  plugins: [
    graphQLPlugin({
      maxComplexity: 1000,
    }),
  ],
})
```

### Wire up the Next.js routes

```ts
// app/(payload)/api/graphql/route.ts
import config from '@payload-config'
import { GRAPHQL_POST } from '@payloadcms/plugin-graphql/next'

export const POST = GRAPHQL_POST(config)
```

```ts
// app/(payload)/api/graphql-playground/route.ts
import config from '@payload-config'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/plugin-graphql/next'

export const GET = GRAPHQL_PLAYGROUND_GET(config)
```

## Plugin options

All previous `config.graphQL` options are accepted on the plugin call:

| Option                             | Type                                                | Default                           | Description                                                                        |
| ---------------------------------- | --------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| `disable`                          | `boolean`                                           | `false`                           | Disable the GraphQL endpoint and schema build.                                     |
| `disableIntrospectionInProduction` | `boolean`                                           | `true`                            | Disable schema introspection in production.                                        |
| `disablePlaygroundInProduction`    | `boolean`                                           | `true`                            | Hide the GraphQL Playground in production.                                         |
| `maxComplexity`                    | `number`                                            | `1000`                            | Maximum allowed query complexity.                                                  |
| `mutations`                        | `GraphQLExtension`                                  | —                                 | Custom mutations to add to the schema.                                             |
| `queries`                          | `GraphQLExtension`                                  | —                                 | Custom queries to add to the schema.                                               |
| `schemaOutputFile`                 | `string`                                            | `<cwd>/schema.graphql`            | Path to write the generated schema when running `payload-graphql generate:schema`. |
| `validationRules`                  | `(args: GraphQL.ExecutionArgs) => ValidationRule[]` | —                                 | Additional validation rules applied to every query.                                |
| `routes`                           | `{ graphQL?: string; graphQLPlayground?: string }`  | `/graphql`, `/graphql-playground` | Override the route paths registered in `config.routes`.                            |

## Schema generation

The plugin ships the existing `payload-graphql generate:schema` CLI:

```sh
pnpm exec payload-graphql generate:schema
```

## Migrating from Payload v3 (`@payloadcms/graphql`)

A migration helper is included that updates your `payload.config.ts` and Next.js route handlers in place:

```sh
# preview the changes
pnpm exec payload-graphql migrate --dry

# apply
pnpm exec payload-graphql migrate
```

The script:

- Adds `import { graphQLPlugin } from '@payloadcms/plugin-graphql'` to `payload.config.ts`
- Wraps your existing `graphQL: { ... }` block as `graphQLPlugin({ ... })` and pushes it into `plugins`
- Moves `routes.graphQL` / `routes.graphQLPlayground` into the plugin's `routes` option
- Rewrites `app/(payload)/api/graphql/route.ts` and `.../graphql-playground/route.ts` imports from `@payloadcms/next/routes` to `@payloadcms/plugin-graphql/next`

After the script runs, install the new package and remove the old one:

```sh
pnpm add @payloadcms/plugin-graphql
pnpm remove @payloadcms/graphql
```

The migration is regex-based and assumes a conventional `payload.config.ts`. Always commit before running so you can review the diff.

See [docs/graphql/migration-v4.mdx](../../docs/graphql/migration-v4.mdx) for a full migration guide.
