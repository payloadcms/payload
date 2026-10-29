Written with AI

# Payload Cloudflare Plugin

`@payloadcms/plugin-cloudflare` centralizes Payload configuration defaults for Cloudflare Workers. Use it in local development too, so password hashes and upload settings match production.

```sh
pnpm add @payloadcms/plugin-cloudflare
```

```ts
import { cloudflarePlugin } from '@payloadcms/plugin-cloudflare'
import { buildConfig } from 'payload'

export default buildConfig({
  // Configure your database, collections, and storage separately.
  plugins: [cloudflarePlugin()],
})
```

## Compatibility defaults

The plugin supplies defaults and preserves explicit Payload configuration:

- `auth.passwordHashIterations: 100000` for the Workers PBKDF2 limit.
- A console-based Pino logger that emits JSON and supports log levels, child bindings, and error serialization. It uses `PAYLOAD_LOG_LEVEL` (default `info`) and honors `DISABLE_LOGGING=true`. An explicit `config.logger` takes precedence.
- `upload.crop: false` and `upload.focalPoint: false` for upload-enabled collections, including `upload: true`. Other upload settings and collection fields, such as alternative text, are preserved. Explicit crop/focal-point settings can be used with a compatible image transformer.

The plugin runs with order `100`, after plugins with the default order, to include upload collections they add. Place plugins that add upload collections before it in execution order.

The plugin does not select D1 or R2, attach resource bindings, or configure image transformers. Configure compatible storage for every upload collection; Workers deployments should not rely on persistent local file storage. The R2 adapter already disables local storage for its configured collections. Wrangler, OpenNext, and Next.js build settings still belong to the application. The [Cloudflare template](../../templates/with-cloudflare-d1) demonstrates those settings.

## Password security and migration

Opting into this plugin lowers the default PBKDF2-SHA256 work factor from 600,000 to 100,000. For otherwise identical parameters, each offline password guess takes roughly one sixth of the computational work. Payload retains its [OWASP-aligned default](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) for deployments that do not use this plugin.

The configured count applies to new passwords and hashes rewritten after a successful login. A Workers runtime limited to 100,000 iterations cannot verify an existing 600,000-iteration hash. Users must reset their password or first log in through a capable runtime configured for 100,000 iterations. The plugin cannot convert stored hashes without the password.

Keep the iteration configuration consistent across deployments sharing a database. Older Payload versions that do not understand the 100,000-iteration hash prefix cannot authenticate users with those hashes; account for this before rolling back or running mixed versions. An explicit `auth.passwordHashIterations` is preserved, so explicitly selecting 600,000 still requires a runtime that supports it.

## Options

| Option             | Default | Behavior                                                                                                         |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `enabled`          | `true`  | Set `false` to return the config unchanged.                                                                      |
| `useConsoleLogger` | `true`  | Supply the Workers-compatible logger when no logger is configured. Set `false` to let Payload select its logger. |
| `useNativeFetch`   | `false` | Default upload collections to `skipSafeFetch: true`, bypassing Payload's SSRF-filtering fetch.                   |

Only enable `useNativeFetch` when your deployment restricts outbound access to trusted destinations. This applies to local development as well as production; Workers networking assumptions may not hold on a developer machine or when private-network integrations are enabled. Explicit collection-level `skipSafeFetch` settings, including allowlists and `false`, take precedence.

```ts
cloudflarePlugin({ useNativeFetch: true })
```
