import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, DbType, ProjectTemplate } from '../types.js'

import { debug, error } from '../utils/log.js'

/** Parse and swap .env.example values and write .env */
export async function writeEnvFile(args: {
  cliArgs: CliArgs
  databaseType?: DbType
  databaseUri: string
  payloadSecret: string
  projectDir: string
  template?: ProjectTemplate
}): Promise<void> {
  const { cliArgs, databaseType, databaseUri, payloadSecret, projectDir, template } = args

  if (cliArgs['--dry-run']) {
    debug(`DRY RUN: .env file created`)
    return
  }

  const envOutputPath = path.join(projectDir, '.env')

  try {
    let fileContents: string

    if (template?.type === 'starter') {
      // Parse .env file into key/value pairs
      const envExample = path.join(projectDir, '.env.example')
      const envFile = await fs.readFile(envExample, 'utf8')

      fileContents =
        `# Added by Payload\n` +
        envFile
          .split('\n')
          .filter((e) => e)
          .map((line) => {
            if (line.startsWith('#') || !line.includes('=')) {
              return line
            }

            const split = line.split('=')
            let key = split[0]
            let value = split[1]

            if (
              key === 'MONGODB_URI' ||
              key === 'MONGO_URL' ||
              key === 'DATABASE_URI' ||
              key === 'POSTGRES_URL'
            ) {
              if (databaseType === 'vercel-postgres') {
                key = 'POSTGRES_URL'
              }
              value = databaseUri
            }
            if (key === 'PAYLOAD_SECRET' || key === 'PAYLOAD_SECRET_KEY') {
              value = payloadSecret
            }

            return `${key}=${value}`
          })
          .join('\n')
    } else {
      fileContents = `# Added by Payload\nDATABASE_URI=${databaseUri}\nPAYLOAD_SECRET=${payloadSecret}\n`
    }

    if (fs.existsSync(envOutputPath)) {
      const existingEnv = await fs.readFile(envOutputPath, 'utf8')
      const newEnv = existingEnv + '\n# Added by Payload' + fileContents
      await fs.writeFile(envOutputPath, newEnv)
    } else {
      await fs.writeFile(envOutputPath, fileContents)
    }
  } catch (err: unknown) {
    error('Unable to write .env file')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
