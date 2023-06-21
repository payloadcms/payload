import path from 'path'
import fs from 'fs-extra'
import type { ProjectTemplate } from '../types'
import { error, success } from '../utils/log'

export async function writeEnvFile(args: {
  databaseUri: string
  payloadSecret: string
  template: ProjectTemplate
  projectDir: string
}): Promise<void> {
  const { databaseUri, payloadSecret, template, projectDir } = args
  try {
    if (
      template.type === 'starter' &&
      fs.existsSync(path.join(projectDir, '.env.example'))
    ) {
      // Parse .env file into key/value pairs
      const envFile = await fs.readFile(
        path.join(projectDir, '.env.example'),
        'utf8',
      )
      const envFileLines = envFile.split('\n').filter(e => e)

      const envFilePairs = envFileLines.map(line => {
        const [key, value] = line.split('=')
        return { key, value }
      })

      // Replace MONGODB_URI and PAYLOAD_SECRET values
      const newEnvFilePairs = envFilePairs.map(pair => {
        if (pair.key === 'MONGODB_URI' || pair.key === 'MONGO_URL') {
          return { key: pair.key, value: databaseUri }
        }
        if (pair.key === 'PAYLOAD_SECRET' || pair.key === 'PAYLOAD_SECRET_KEY') {
          return { key: pair.key, value: payloadSecret }
        }
        return pair
      })

      // Write new .env file
      const newEnvFileLines = newEnvFilePairs.map(
        pair => `${pair.key}=${pair.value}`,
      )

      await fs.writeFile(path.join(projectDir, '.env'), newEnvFileLines.join('\n'))
      return
    }

    const content = `MONGODB_URI=${databaseUri}\nPAYLOAD_SECRET=${payloadSecret}`

    await fs.outputFile(`${projectDir}/.env`, content)
    success('.env file created')
  } catch (err: unknown) {
    error('Unable to write .env file')
    if (err instanceof Error) {
      error(err.message)
    }
    process.exit(1)
  }
}
