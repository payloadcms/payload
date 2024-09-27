// Set config path and TS output path using test dir
import fs from 'fs'
import path from 'path'

export function setTestEnvPaths(dir: string) {
  const configPath = path.resolve(dir, 'config.ts')
  const outputPath = path.resolve(dir, 'payload-types.ts')
  const schemaPath = path.resolve(dir, 'schema.graphql')
  if (fs.existsSync(configPath)) {
    process.env.PAYLOAD_CONFIG_PATH = configPath
    process.env.PAYLOAD_TS_OUTPUT_PATH = outputPath
    process.env.PAYLOAD_GRAPHQL_SCHEMA_PATH = schemaPath
    return true
  }
  return false
}
