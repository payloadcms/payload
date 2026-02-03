import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { setupVitest } from '@tools/test-utils/setup/vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

setupVitest({ outputDir: dirname })
