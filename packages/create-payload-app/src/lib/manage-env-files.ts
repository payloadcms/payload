import fs from 'fs-extra'
import path from 'path'

import type { CliArgs, DbType, ProjectTemplate } from '../types.js'

import { debug, error } from '../utils/log.js'
import { dbChoiceRecord } from './select-db.js'

const sanitizeEnv = ({
  contents,
  databaseType,
  databaseUri,
  payloadSecret,
}: {
  contents: string
  databaseType: DbType | undefined
  databaseUri?: string
  payloadSecret?: string
}): string => {
  const seenKeys = new Set<string>()

  // add defaults
  let withDefaults = contents

  if (
    !contents.includes('DATABASE_URL') &&
    !contents.includes('POSTGRES_URL') &&
    !contents.includes('MONGODB_URL') &&
    databaseType !== 'd1-sqlite'
  ) {
    withDefaults += '\nDATABASE_URL=your-connection-string-here'
  }

  if (!contents.includes('PAYLOAD_SECRET')) {
    withDefaults += '\nPAYLOAD_SECRET=YOUR_SECRET_HERE'
  }

  let updatedEnv = withDefaults
    .split('\n')
    .map((line) => {
      if (line.startsWith('#') || !line.includes('=')) {
        return line
      }

      const [key, value] = line.split('=')

      if (!key) {
        return
      }

      if (key === 'DATABASE_URL' || key === 'POSTGRES_URL' || key === 'MONGODB_URL') {
        const dbChoice = databaseType ? dbChoiceRecord[databaseType] : null

        if (dbChoice) {
          const placeholderUri = databaseUri
            ? databaseUri
            : `${dbChoice.dbConnectionPrefix}your-database-name${dbChoice.dbConnectionSuffix || ''}`
          line =
            databaseType === 'vercel-postgres'
              ? `POSTGRES_URL=${placeholderUri}`
              : `DATABASE_URL=${placeholderUri}`
        } else {
          line = `${key}=${value}`
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

  if (!updatedEnv.includes('# Added by Payload')) {
    updatedEnv = `# Added by Payload\n${updatedEnv}`
  }

  return updatedEnv
}

/** Parse and swap .env.example values and write .env */
export async function manageEnvFiles(args: {
  cliArgs: CliArgs
  databaseType?: DbType
  databaseUri?: string
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

  const pathToEnvExample = path.join(projectDir, '.env.example')
  const envPath = path.join(projectDir, '.env')

  let exampleEnv: null | string = ''

  try {
    if (template?.type === 'plugin') {
      if (debugFlag) {
        debug(`plugin template detected - no .env added .env.example added`)
      }

      return
    }

    // If there's a .env.example file, use it to create or update the .env file
    if (fs.existsSync(pathToEnvExample)) {
      const envExampleContents = await fs.readFile(pathToEnvExample, 'utf8')

      exampleEnv = sanitizeEnv({
        contents: envExampleContents,
        databaseType,
        databaseUri,
        payloadSecret,
      })

      if (debugFlag) {
        debug(`.env.example file successfully read`)
      }
    }

    // If there's no .env file, create it using the .env.example content (if it exists)
    if (!fs.existsSync(envPath)) {
      const envContent = sanitizeEnv({
        contents: exampleEnv,
        databaseType,
        databaseUri,
        payloadSecret,
      })

      await fs.writeFile(envPath, envContent)

      if (debugFlag) {
        debug(`.env file successfully created`)
      }
    } else {
      // If the .env file already exists, sanitize it as-is
      const envContents = await fs.readFile(envPath, 'utf8')

      const updatedEnvContents = sanitizeEnv({
        contents: envContents,
        databaseType,
        databaseUri,
        payloadSecret,
      })

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
