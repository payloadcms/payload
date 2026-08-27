/**
 * Standalone CLI test for `migrate:api-keys`, isolated from the other api-keys suites
 * since migrateCLI creates its own Payload instance internally (same rationale as
 * test/database/migrations-cli.int.spec.ts).
 */
import path from 'path'
import { migrateCLI } from 'payload'
import { fileURLToPath } from 'url'
import { expect, describe as vitestDescribe } from 'vitest'

import { it } from '../__helpers/int/vitest.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

vitestDescribe('migrate:api-keys CLI', () => {
  // migrate:api-keys sets PAYLOAD_MIGRATING, which skips the relational adapters' dev-schema
  // auto-push (the same behavior every migrate:* command relies on to require a real schema
  // migration first). On MongoDB, collections are created lazily on first write, so this
  // wiring test runs there; the underlying migration logic itself is already covered on
  // every adapter by migration.int.spec.ts, which shares one live connection throughout.
  it('should run a dry run against a clean config without throwing', { db: 'mongo' }, async () => {
    const { config, payload } = await initPayloadInt(dirname)
    await payload.destroy()

    await expect(
      migrateCLI({
        config,
        parsedArgs: {
          _: ['migrate:api-keys'],
          'dry-run': true,
        },
      }),
    ).resolves.toBeUndefined()
  })
})
