import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, ProjectTemplate } from '../types.js'

import { debug, error } from '../utils/log.js'

/** Parse and swap .env.example values and write .env */
export async function writeEnvFile(args: {
  cliArgs: CliArgs
  databaseUri: string
  payloadSecret: string
  projectDir: string
  template?: ProjectTemplate
}): Promise<void> {
  const { cliArgs, databaseUri, payloadSecret, projectDir, template } = args

  if (cliArgs['--dry-run']) {
    debug(`DRY RUN: .env file created`)
    return
  }

  const envOutputPath = path.join(projectDir, '.env')

  try {
    if (fs.existsSync(envOutputPath)) {
      if (template?.type === 'starter') {
        // Parse .env file into key/value pairs
        const envFile = await fs.readFile(path.join(projectDir, '.env.example'), 'utf8')
        const envWithValues: string[] = envFile
          .split('\n')
          .filter((e) => e)
          .map((line) => {
            if (line.startsWith('#') || !line.includes('=')) return line

            const split = line.split('=')
            const key = split[0]
            let value = split[1]

            if (key === 'MONGODB_URI' || key === 'MONGO_URL' || key === 'DATABASE_URI') {
              value = databaseUri
            }
            if (key === 'PAYLOAD_SECRET' || key === 'PAYLOAD_SECRET_KEY') {
              value = payloadSecret
            }

            return `${key}=${value}`
          })

        // Write new .env file
        await fs.writeFile(envOutputPath, envWithValues.join('\n'))
      } else {
        const existingEnv = await fs.readFile(envOutputPath, 'utf8')
        const newEnv =
          existingEnv + `\nDATABASE_URI=${databaseUri}\nPAYLOAD_SECRET=${payloadSecret}\n`
        await fs.writeFile(envOutputPath, newEnv)
      }
    } else {
      const content = `DATABASE_URI=${databaseUri}\nPAYLOAD_SECRET=${payloadSecret}`
      await fs.outputFile(`${projectDir}/.env`, content)
    }
  } catch (err: unknown) {
    error('Unable to write .env file')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
