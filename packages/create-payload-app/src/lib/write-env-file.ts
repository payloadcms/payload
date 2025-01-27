import fs from 'fs-extra'
import path from 'path'

import type { ProjectTemplate } from '../types'

import { error, success } from '../utils/log'

/** Parse and swap .env.example values and write .env */
export async function writeEnvFile(args: {
  databaseUri: string
  payloadSecret: string
  projectDir: string
  template: ProjectTemplate
}): Promise<void> {
  const { databaseUri, payloadSecret, projectDir, template } = args
  try {
    if (template.type === 'starter' && fs.existsSync(path.join(projectDir, '.env.example'))) {
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
      await fs.writeFile(path.join(projectDir, '.env'), envWithValues.join('\n'))
    } else {
      const content = `MONGODB_URI=${databaseUri}\nPAYLOAD_SECRET=${payloadSecret}`
      await fs.outputFile(`${projectDir}/.env`, content)
    }

    success('.env file created')
  } catch (err: unknown) {
    error('Unable to write .env file')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
