import fse from 'fs-extra'
import globby from 'globby'
import path from 'path'

import type { DbType, StorageAdapterType } from '../types.js'

import { warning } from '../utils/log.js'
import { dbReplacements, storageReplacements } from './replacements.js'

/** Update payload config with necessary imports and adapters */
export async function configurePayloadConfig(args: {
  dbType?: DbType
  envNames?: {
    dbUri: string
  }
  packageJsonName?: string
  projectDirOrConfigPath: { payloadConfigPath: string } | { projectDir: string }
  storageAdapter?: StorageAdapterType
}): Promise<void> {
  if (!args.dbType) {
    return
  }

  // Update package.json
  const packageJsonPath =
    'projectDir' in args.projectDirOrConfigPath &&
    path.resolve(args.projectDirOrConfigPath.projectDir, 'package.json')

  if (packageJsonPath && fse.existsSync(packageJsonPath)) {
    try {
      const packageObj = await fse.readJson(packageJsonPath)

      const dbPackage = dbReplacements[args.dbType]

      // Delete all other db adapters
      Object.values(dbReplacements).forEach((p) => {
        if (p.packageName !== dbPackage.packageName) {
          delete packageObj.dependencies[p.packageName]
        }
      })

      // Set version of db adapter to match payload version
      packageObj.dependencies[dbPackage.packageName] = packageObj.dependencies['payload']

      if (args.storageAdapter) {
        const storagePackage = storageReplacements[args.storageAdapter]

        // Set version of storage adapter to match payload version
        packageObj.dependencies[storagePackage.packageName] = packageObj.dependencies['payload']
      }

      if (args.packageJsonName) {
        packageObj.name = args.packageJsonName
      }

      await fse.writeJson(packageJsonPath, packageObj, { spaces: 2 })
    } catch (err: unknown) {
      warning(`Unable to configure Payload in package.json`)
      warning(err instanceof Error ? err.message : '')
    }
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

    const dbReplacement = dbReplacements[args.dbType]

    let dbConfigStartLineIndex: number | undefined
    let dbConfigEndLineIndex: number | undefined

    let storageConfigLine: number | undefined

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

      if (l.includes('// storage-adapter-placeholder')) {
        storageConfigLine = i
      }
    })

    if (args.storageAdapter && storageConfigLine) {
      const storageReplacement = storageReplacements[args.storageAdapter]

      if (storageReplacement) {
        configLines.splice(storageConfigLine, 0, ...storageReplacement.configReplacement)
        configLines.splice(storageConfigLine + storageReplacement.configReplacement.length, 1)
      }

      // Prepend import statement to beginning of file
      configLines.unshift(storageReplacement.importReplacement)
      if (dbConfigStartLineIndex) dbConfigStartLineIndex += 1
      if (dbConfigEndLineIndex) dbConfigEndLineIndex += 1
    }

    if (dbConfigStartLineIndex && dbConfigEndLineIndex) {
      configLines.splice(
        dbConfigStartLineIndex,
        dbConfigEndLineIndex - dbConfigStartLineIndex + 1,
        ...dbReplacement.configReplacement(args.envNames?.dbUri),
      )
    } else {
      warning('Unable to update payload.config.ts with database adapter import')
    }

    fse.writeFileSync(payloadConfigPath, configLines.join('\n'))
  } catch (err: unknown) {
    warning(
      `Unable to update payload.config.ts with plugins: ${err instanceof Error ? err.message : ''}`,
    )
  }
}
