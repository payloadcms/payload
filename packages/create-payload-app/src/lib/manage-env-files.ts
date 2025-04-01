import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, DbType, ProjectTemplate } from '../types.js'

import { debug, error } from '../utils/log.js'
import { dbChoiceRecord } from './select-db.js'

const updateEnvExampleVariables = (contents: string, databaseType: DbType | undefined): string => {
  return contents
    .split('\n')
    .map((line) => {
      if (line.startsWith('#') || !line.includes('=')) {
        return line // Preserve comments and unrelated lines
      }

      const [key] = line.split('=')

      if (key === 'DATABASE_URI' || key === 'POSTGRES_URL' || key === 'MONGODB_URI') {
        const dbChoice = databaseType ? dbChoiceRecord[databaseType] : null

        if (dbChoice) {
          const placeholderUri = `${dbChoice.dbConnectionPrefix}your-database-name${
            dbChoice.dbConnectionSuffix || ''
          }`
          return databaseType === 'vercel-postgres'
            ? `POSTGRES_URL=${placeholderUri}`
            : `DATABASE_URI=${placeholderUri}`
        }

        return `DATABASE_URI=your-database-connection-here` // Fallback
      }

      if (key === 'PAYLOAD_SECRET' || key === 'PAYLOAD_SECRET_KEY') {
        return `PAYLOAD_SECRET=YOUR_SECRET_HERE`
      }

      return line
    })
    .join('\n')
}

const generateEnvContent = (
  existingEnv: string,
  databaseType: DbType | undefined,
  databaseUri: string,
  payloadSecret: string,
): string => {
  const dbKey = databaseType === 'vercel-postgres' ? 'POSTGRES_URL' : 'DATABASE_URI'

  const envVars: Record<string, string> = {}
  existingEnv
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .forEach((line) => {
      const [key, value] = line.split('=')
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      envVars[key] = value
    })

  // Override specific keys
  envVars[dbKey] = databaseUri
  envVars['PAYLOAD_SECRET'] = payloadSecret

  // Rebuild content
  return Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
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

  const debugFlag = cliArgs['--debug']

  if (cliArgs['--dry-run']) {
    debug(`DRY RUN: Environment files managed`)
    return
  }

  const envExamplePath = path.join(projectDir, '.env.example')
  const envPath = path.join(projectDir, '.env')

  try {
    let updatedExampleContents: string

    // Update .env.example
    if (template?.type === 'starter') {
      if (!fs.existsSync(envExamplePath)) {
        error(`.env.example file not found at ${envExamplePath}`)
        process.exit(1)
      }

      const envExampleContents = await fs.readFile(envExamplePath, 'utf8')
      updatedExampleContents = updateEnvExampleVariables(envExampleContents, databaseType)

      await fs.writeFile(envExamplePath, updatedExampleContents.trimEnd() + '\n')

      if (debugFlag) {
        debug(`.env.example file successfully updated`)
      }
    } else {
      updatedExampleContents = `# Added by Payload\nDATABASE_URI=your-connection-string-here\nPAYLOAD_SECRET=YOUR_SECRET_HERE\n`
      await fs.writeFile(envExamplePath, updatedExampleContents.trimEnd() + '\n')
    }

    // Merge existing variables and create or update .env
    const envExampleContents = await fs.readFile(envExamplePath, 'utf8')
    const envContent = generateEnvContent(
      envExampleContents,
      databaseType,
      databaseUri,
      payloadSecret,
    )
    await fs.writeFile(envPath, `# Added by Payload\n${envContent.trimEnd()}\n`)

    if (debugFlag) {
      debug(`.env file successfully created or updated`)
    }
  } catch (err: unknown) {
    error('Unable to manage environment files')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
