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
  sharp?: boolean
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

        if (storagePackage?.packageName) {
          // Set version of storage adapter to match payload version
          packageObj.dependencies[storagePackage.packageName] = packageObj.dependencies['payload']
        }
      }

      // Sharp provided by default, only remove if explicitly set to false
      if (args.sharp === false) {
        delete packageObj.dependencies['sharp']
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
    let configLines = configContent.split('\n')

    // DB Replacement
    const dbReplacement = dbReplacements[args.dbType]

    configLines = replaceInConfigLines({
      endMatch: `// database-adapter-config-end`,
      lines: configLines,
      replacement: dbReplacement.configReplacement(args.envNames?.dbUri),
      startMatch: `// database-adapter-config-start`,
    })

    configLines = replaceInConfigLines({
      lines: configLines,
      replacement: [dbReplacement.importReplacement],
      startMatch: '// database-adapter-import',
    })

    // Storage Adapter Replacement
    if (args.storageAdapter) {
      const replacement = storageReplacements[args.storageAdapter]
      configLines = replaceInConfigLines({
        lines: configLines,
        replacement: replacement.configReplacement,
        startMatch: '// storage-adapter-placeholder',
      })

      if (replacement?.importReplacement !== undefined) {
        configLines = replaceInConfigLines({
          lines: configLines,
          replacement: [replacement.importReplacement],
          startMatch: '// storage-adapter-import-placeholder',
        })
      }
    }

    // Sharp Replacement (provided by default, only remove if explicitly set to false)
    if (args.sharp === false) {
      configLines = replaceInConfigLines({
        lines: configLines,
        replacement: [],
        startMatch: 'sharp,',
      })
      configLines = replaceInConfigLines({
        lines: configLines,
        replacement: [],
        startMatch: "import sharp from 'sharp'",
      })
    }

    fse.writeFileSync(payloadConfigPath, configLines.join('\n'))
  } catch (err: unknown) {
    warning(
      `Unable to update payload.config.ts with plugins: ${err instanceof Error ? err.message : ''}`,
    )
  }
}

function replaceInConfigLines({
  endMatch,
  lines,
  replacement,
  startMatch,
}: {
  /** Optional endMatch to replace multiple lines */
  endMatch?: string
  lines: string[]
  replacement: string[]
  startMatch: string
}) {
  if (!replacement) {
    return lines
  }

  const startIndex = lines.findIndex((l) => l.includes(startMatch))
  const endIndex = endMatch ? lines.findIndex((l) => l.includes(endMatch)) : startIndex

  if (startIndex === -1 || endIndex === -1) {
    return lines
  }

  lines.splice(startIndex, endIndex - startIndex + 1, ...replacement)
  return lines
}
