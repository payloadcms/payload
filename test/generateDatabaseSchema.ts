import path from 'path'
import { getPayload, type SanitizedConfig } from 'payload'
import { fileURLToPath } from 'url'

import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'
import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const writeDBAdapter = process.env.WRITE_DB_ADAPTER !== 'false'
process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE || 'true'

if (process.env.PAYLOAD_DATABASE === 'mongodb') {
  throw new Error('Not supported')
}

if (writeDBAdapter) {
  generateDatabaseAdapter(process.env.PAYLOAD_DATABASE || 'postgres')
  process.env.WRITE_DB_ADAPTER = 'false'
}

const loadConfig = async (configPath: string): Promise<SanitizedConfig> => {
  return await (
    await import(configPath)
  ).default
}

if (!testConfigDir) {
  throw new Error('Yo must Specify testConfigDir')
}

const testDir = path.resolve(dirname, testConfigDir)
const config = await loadConfig(path.resolve(testDir, 'config.ts'))

setTestEnvPaths(testDir)

const payload = await getPayload({ config })

// await payload.db.dropDatabase({ adapter: payload.db })

await payload.db.generateSchema({
  outputFile: path.resolve(testDir, 'payload-generated-schema.ts'),
})

process.exit(0)
