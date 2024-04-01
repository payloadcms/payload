import fse from 'fs-extra'
import globby from 'globby'

import type { DbDetails } from '../types.js'

import { warning } from '../utils/log.js'
import { dbReplacements } from './packages.js'

/** Update payload config with necessary imports and adapters */
export async function configurePayloadConfig(args: {
  dbDetails: DbDetails | undefined
  projectDirOrConfigPath: { payloadConfigPath: string } | { projectDir: string }
}): Promise<void> {
  if (!args.dbDetails) {
    return
  }

  try {
    let payloadConfigPath: string | undefined
    if (!('payloadConfigPath' in args.projectDirOrConfigPath)) {
      payloadConfigPath = (
        await globby('**/payload.config.ts', {
          absolute: true,
          cwd: args.projectDirOrConfigPath.projectDir,
        })
      )?.[0]
    } else {
      payloadConfigPath = args.projectDirOrConfigPath.payloadConfigPath
    }

    if (!payloadConfigPath) {
      warning('Unable to update payload.config.ts with plugins. Could not find payload.config.ts.')
      return
    }

    const configContent = fse.readFileSync(payloadConfigPath, 'utf-8')
    const configLines = configContent.split('\n')

    const dbReplacement = dbReplacements[args.dbDetails.type]

    let dbConfigStartLineIndex: number | undefined
    let dbConfigEndLineIndex: number | undefined

    configLines.forEach((l, i) => {
      if (l.includes('// database-adapter-import')) {
        configLines[i] = dbReplacement.importReplacement
      }

      if (l.includes('// database-adapter-config-start')) {
        dbConfigStartLineIndex = i
      }
      if (l.includes('// database-adapter-config-end')) {
        dbConfigEndLineIndex = i
      }
    })

    if (!dbConfigStartLineIndex || !dbConfigEndLineIndex) {
      warning('Unable to update payload.config.ts with database adapter import')
    } else {
      // Replaces lines between `// database-adapter-config-start` and `// database-adapter-config-end`
      configLines.splice(
        dbConfigStartLineIndex,
        dbConfigEndLineIndex - dbConfigStartLineIndex + 1,
        ...dbReplacement.configReplacement,
      )
    }

    fse.writeFileSync(payloadConfigPath, configLines.join('\n'))
  } catch (err: unknown) {
    warning(
      `Unable to update payload.config.ts with plugins: ${err instanceof Error ? err.message : ''}`,
    )
  }
}
