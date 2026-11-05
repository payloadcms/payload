import * as p from '@clack/prompts'

import { cleanAll } from './docker-lib.ts'

p.intro('Cleaning payload docker services')

const s = p.spinner()
s.start('Removing containers and wiping volumes')
try {
  await cleanAll()
  s.stop('Cleaned containers and volumes')
  p.outro('✓ All services stopped, volumes wiped.')
} catch (err) {
  s.stop('Failed')
  p.cancel(err instanceof Error ? err.message : String(err))
  process.exit(1)
}
