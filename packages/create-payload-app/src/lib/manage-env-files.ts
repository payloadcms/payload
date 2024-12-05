import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, DbType, ProjectTemplate } from '../types.js'

import { debug, error } from '../utils/log.js'

const updateEnvVariables = (
  contents: string,
  databaseType: DbType | undefined,
  databaseUri: string,
  payloadSecret: string,
): string => {
  return contents
    .split('\n')
    .filter((e) => e)
    .map((line) => {
      if (line.startsWith('#') || !line.includes('=')) {
        return line
      }

      const [key, ...valueParts] = line.split('=')
      let value = valueParts.join('=')

      if (
        key === 'MONGODB_URI' ||
        key === 'MONGO_URL' ||
        key === 'DATABASE_URI' ||
        key === 'POSTGRES_URL'
      ) {
        value = databaseUri
        if (databaseType === 'vercel-postgres') {
          value = databaseUri
        }
      }

      if (key === 'PAYLOAD_SECRET' || key === 'PAYLOAD_SECRET_KEY') {
        value = payloadSecret
      }

      return `${key}=${value}`
    })
    .join('\n')
}

/** Parse and swap .env.example values and write .env */
export async function manageEnvFiles(args: {
  cliArgs: CliArgs
  databaseType?: DbType
  databaseUri: string
  payloadSecret: string
  projectDir: string
  template?: ProjectTemplate
}): Promise<void> {
  const { cliArgs, databaseType, databaseUri, payloadSecret, projectDir, template } = args

  if (cliArgs['--dry-run']) {
    debug(`DRY RUN: Environment files managed`)
    return
  }

  const envExamplePath = path.join(projectDir, '.env.example')
  const envPath = path.join(projectDir, '.env')

  try {
    let updatedExampleContents: string

    if (template?.type === 'starter') {
      if (!fs.existsSync(envExamplePath)) {
        error(`.env.example file not found at ${envExamplePath}`)
        process.exit(1)
      }

      const envExampleContents = await fs.readFile(envExamplePath, 'utf8')
      updatedExampleContents = updateEnvVariables(
        envExampleContents,
        databaseType,
        databaseUri,
        payloadSecret,
      )

      await fs.writeFile(envExamplePath, updatedExampleContents)
      debug(`.env.example file successfully updated`)
    } else {
      updatedExampleContents = `# Added by Payload\nDATABASE_URI=${databaseUri}\nPAYLOAD_SECRET=${payloadSecret}\n`
    }

    const existingEnvContents = fs.existsSync(envPath) ? await fs.readFile(envPath, 'utf8') : ''
    const updatedEnvContents = existingEnvContents
      ? `${existingEnvContents}\n# Added by Payload\n${updatedExampleContents}`
      : `# Added by Payload\n${updatedExampleContents}`

    await fs.writeFile(envPath, updatedEnvContents)
    debug(`.env file successfully created or updated`)
  } catch (err: unknown) {
    error('Unable to manage environment files')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
