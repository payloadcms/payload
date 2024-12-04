import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, DbType } from '../types.js'

import { debug, error } from '../utils/log.js'

/** Parse and update .env.example based on selected database */
export async function updateEnvExampleFile(args: {
  cliArgs: CliArgs
  databaseType: DbType
  databaseUri: string
  payloadSecret: string
  projectDir: string
}): Promise<void> {
  const { cliArgs, databaseType, databaseUri, payloadSecret, projectDir } = args

  if (cliArgs['--dry-run']) {
    debug(`DRY RUN: .env.example file updated`)
    return
  }

  const envExamplePath = path.join(projectDir, '.env.example')

  try {
    if (!fs.existsSync(envExamplePath)) {
      error(`.env.example file not found at ${envExamplePath}`)
      process.exit(1)
    }

    const envFileContents = await fs.readFile(envExamplePath, 'utf8')
    const updatedContents = envFileContents
      .split('\n')
      .map((line) => {
        if (line.startsWith('#') || !line.includes('=')) {
          return line // Preserve comments and unrelated lines
        }

        const [key, ...valueParts] = line.split('=')
        const existingValue = valueParts.join('=') // Preserve existing value if not updated

        let newValue = existingValue

        if (
          key === 'MONGODB_URI' ||
          key === 'MONGO_URL' ||
          key === 'DATABASE_URI' ||
          key === 'POSTGRES_URL'
        ) {
          // Replace database URI based on selected type
          if (databaseType === 'vercel-postgres' || databaseType === 'postgres') {
            newValue = databaseUri
          } else if (databaseType === 'mongodb') {
            newValue = databaseUri
          } else if (databaseType === 'sqlite') {
            newValue = databaseUri
          }
        }

        if (key === 'PAYLOAD_SECRET' || key === 'PAYLOAD_SECRET_KEY') {
          newValue = payloadSecret
        }

        return `${key}=${newValue}`
      })
      .join('\n')

    await fs.writeFile(envExamplePath, updatedContents)
    debug(`.env.example file successfully updated with selected database`)
  } catch (err: unknown) {
    error('Unable to update .env.example file')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
