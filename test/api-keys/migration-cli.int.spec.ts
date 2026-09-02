/**
 * Standalone CLI test for `migrate:api-keys`, isolated from the other api-keys suites
 * since it spawns its own Payload instance via the CLI (same rationale as
 * test/database/migrations-cli.int.spec.ts).
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { describe as vitestDescribe } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { runCLICommand } from '../__helpers/shared/runCLICommand.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

vitestDescribe('migrate:api-keys CLI', () => {
  // migrate:api-keys sets PAYLOAD_MIGRATING, which skips the relational adapters' dev-schema
  // auto-push (the same behavior every migrate:* command relies on to require a real schema
  // migration first). On MongoDB, collections are created lazily on first write, so this
  // wiring test runs there; the underlying migration logic itself is already covered on
  // every adapter by migration.int.spec.ts, which shares one live connection throughout.
  test.options({ db: 'mongo' })(
    'should run a dry run against a clean config without throwing',
    async () => {
      await runCLICommand(
        { command: 'migrate:api-keys --dry-run', configPath: path.join(dirname, 'config.ts') },
        { cwd: dirname },
      )
    },
  )
})
