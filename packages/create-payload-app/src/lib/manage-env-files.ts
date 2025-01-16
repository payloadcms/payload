import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, DbType, ProjectTemplate } from '../types.js'

import { debug, error } from '../utils/log.js'
import { dbChoiceRecord } from './select-db.js'

const updateEnvExampleVariables = (
  contents: string,
  databaseType: DbType | undefined,
  payloadSecret?: string,
): string => {
  const updatedEnv = contents
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
        return `PAYLOAD_SECRET=${payloadSecret || 'YOUR_SECRET_HERE'}`
      }

      return line
    })
    .join('\n')

  return updatedEnv
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
  const emptyEnvContent = `# Added by Payload\nDATABASE_URI=your-connection-string-here\nPAYLOAD_SECRET=YOUR_SECRET_HERE\n`
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
      if (!fs.existsSync(envExamplePath)) {
        updatedExampleContents = updateEnvExampleVariables(
          emptyEnvContent,
          databaseType,
          payloadSecret,
        )
      } else {
        const envExampleContents = await fs.readFile(envExamplePath, 'utf8')
        updatedExampleContents = updateEnvExampleVariables(
          envExampleContents,
          databaseType,
          payloadSecret,
        )
      }
      await fs.writeFile(envExamplePath, updatedExampleContents + '\n')
    }

    // Merge existing variables and create or update .env
    const envContents = await fs.readFile(envPath, 'utf8')

    const envContent = updateEnvExampleVariables(envContents, databaseType, payloadSecret)
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
