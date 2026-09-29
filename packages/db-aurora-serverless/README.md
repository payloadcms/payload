# Payload Aurora Serverless Adapter

[Aurora Serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.html) /
[RDS Data API](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html) adapter
for [Payload](https://payloadcms.com).

Unlike the `@payloadcms/db-postgres` adapter, this adapter talks to Postgres over the RDS Data API
instead of a TCP connection pool. Each query is a stateless HTTP call, so a Payload deployment holds
**zero open database connections**. This is what allows Aurora Serverless v2 to auto-pause and scale
to zero when idle.

- [Main Repository](https://github.com/payloadcms/payload)
- [Payload Docs](https://payloadcms.com/docs)

## Installation

```bash
npm install @payloadcms/db-aurora-serverless
```

## Usage

```ts
import { auroraServerlessAdapter } from '@payloadcms/db-aurora-serverless'
import { buildConfig } from 'payload'

export default buildConfig({
  db: auroraServerlessAdapter({
    connection: {
      database: process.env.DATABASE!,
      secretArn: process.env.SECRET_ARN!,
      resourceArn: process.env.RESOURCE_ARN!,
      region: process.env.AWS_REGION!,
    },
  }),
  // ...rest of config
})
```

The `connection` object accepts any [`RDSDataClientConfig`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/rds-data/)
option (`region`, `credentials`, `endpoint`, ...) in addition to the required `database`,
`secretArn` and `resourceArn`.

## Notes and limitations

- **No read replicas.** The Data API does not expose replica routing, so `readReplicas` is not supported.
- **No database auto-creation.** `CREATE DATABASE` is not available through the Data API, so
  `disableCreateDatabase` defaults to `true`. Create the database and schema out-of-band first.
- **Migrations are recommended in production.** Schema pushing works over the driver, but every
  introspection/DDL statement is a paid round-trip subject to the Data API request/response limits.

More detailed usage can be found in the [Payload Docs](https://payloadcms.com/docs/configuration/overview).
