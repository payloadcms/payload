import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, DbType, ProjectTemplate } from '../types.js'

import { debug, error } from '../utils/log.js'
import { dbChoiceRecord } from './select-db.js'

const updateEnvExampleVariables = (
  contents: string,
  databaseType: DbType | undefined,
  payloadSecret?: string,
  databaseUri?: string,
): string => {
  const seenKeys = new Set<string>()
  const updatedEnv = contents
    .split('\n')
    .map((line) => {
      if (line.startsWith('#') || !line.includes('=')) {
        return line
      }

      const [key] = line.split('=')

      if (!key) {return}

      if (key === 'DATABASE_URI' || key === 'POSTGRES_URL' || key === 'MONGODB_URI') {
        const dbChoice = databaseType ? dbChoiceRecord[databaseType] : null
        if (dbChoice) {
          const placeholderUri = databaseUri
            ? databaseUri
            : `${dbChoice.dbConnectionPrefix}your-database-name${dbChoice.dbConnectionSuffix || ''}`
          line =
            databaseType === 'vercel-postgres'
              ? `POSTGRES_URL=${placeholderUri}`
              : `DATABASE_URI=${placeholderUri}`
        }
      }

      if (key === 'PAYLOAD_SECRET' || key === 'PAYLOAD_SECRET_KEY') {
        line = `PAYLOAD_SECRET=${payloadSecret || 'YOUR_SECRET_HERE'}`
      }

      // handles dupes
      if (seenKeys.has(key)) {
        return null
      }

      seenKeys.add(key)

      return line
    })
    .filter(Boolean)
    .reverse()
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

    if (template?.type === 'plugin') {
      if (debugFlag) {
        debug(`plugin template detected - no .env added .env.example added`)
      }
      return
    }

    if (!fs.existsSync(envExamplePath)) {
      updatedExampleContents = updateEnvExampleVariables(
        emptyEnvContent,
        databaseType,
        payloadSecret,
        databaseUri,
      )

      await fs.writeFile(envExamplePath, updatedExampleContents)
      if (debugFlag) {
        debug(`.env.example file successfully created`)
      }
    } else {
      const envExampleContents = await fs.readFile(envExamplePath, 'utf8')
      const mergedEnvs = envExampleContents + '\n' + emptyEnvContent
      updatedExampleContents = updateEnvExampleVariables(
        mergedEnvs,
        databaseType,
        payloadSecret,
        databaseUri,
      )

      await fs.writeFile(envExamplePath, updatedExampleContents)
      if (debugFlag) {
        debug(`.env.example file successfully updated`)
      }
    }

    if (!fs.existsSync(envPath)) {
      const envContent = updateEnvExampleVariables(
        emptyEnvContent,
        databaseType,
        payloadSecret,
        databaseUri,
      )
      await fs.writeFile(envPath, envContent)

      if (debugFlag) {
        debug(`.env file successfully created`)
      }
    } else {
      const envContents = await fs.readFile(envPath, 'utf8')
      const mergedEnvs = envContents + '\n' + emptyEnvContent
      const updatedEnvContents = updateEnvExampleVariables(
        mergedEnvs,
        databaseType,
        payloadSecret,
        databaseUri,
      )

      await fs.writeFile(envPath, updatedEnvContents)
      if (debugFlag) {
        debug(`.env file successfully updated`)
      }
    }
  } catch (err: unknown) {
    error('Unable to manage environment files')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
