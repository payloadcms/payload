import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'

import { createAdminPageModelSource } from '../__helpers/e2e/adminPageModel/generate.js'
import config from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const outputFile = path.resolve(dirname, 'admin-page-model.generated.ts')
const sanitizedConfig = await config
const prettierConfig = await resolveConfig(outputFile)

const source = await format(
  createAdminPageModelSource(sanitizedConfig, {
    collections: ['array-fields', 'relationship-fields', 'text-fields'],
  }),
  {
    ...prettierConfig,
    filepath: outputFile,
  },
)

await writeFile(outputFile, source)

process.stdout.write(`Admin page model written to ${outputFile}\n`)
