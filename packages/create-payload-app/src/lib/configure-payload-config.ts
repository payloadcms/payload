import fse from 'fs-extra'
import globby from 'globby'
import path from 'path'

import type { DbType, StorageAdapterType } from '../types.js'
import type { DatabaseAdapter, StorageAdapter } from './ast/types.js'

import { warning } from '../utils/log.js'
import { updatePackageJson } from './ast/package-json.js'
import { configurePayloadConfig as configurePayloadConfigAST } from './ast/payload-config.js'

/** Map DbType to DatabaseAdapter */
function mapDbType(dbType: DbType): DatabaseAdapter {
  return dbType as DatabaseAdapter
}

/** Map StorageAdapterType to StorageAdapter */
function mapStorageAdapter(storageAdapter: StorageAdapterType): StorageAdapter {
  return storageAdapter as StorageAdapter
}

/** Get default env var name for db type */
function getEnvVarName(dbType: DbType, customEnvName?: string): string {
  if (customEnvName) {
    return customEnvName
  }
  // Default env var names per adapter type
  if (dbType === 'vercel-postgres') {
    return 'POSTGRES_URL'
  }
  return 'DATABASE_URI'
}

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
      updatePackageJson(packageJsonPath, {
        databaseAdapter: mapDbType(args.dbType),
        packageName: args.packageJsonName,
        removeSharp: args.sharp === false,
      })
    } catch (err: unknown) {
      warning(`Unable to configure Payload in package.json`)
      warning(err instanceof Error ? err.message : '')
    }
  }

  // Update payload.config.ts
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

    const envVarName = getEnvVarName(args.dbType, args.envNames?.dbUri)

    const result = await configurePayloadConfigAST(payloadConfigPath, {
      db: {
        type: mapDbType(args.dbType),
        envVarName,
      },
      formatWithPrettier: true,
      removeSharp: args.sharp === false,
      storage: args.storageAdapter ? mapStorageAdapter(args.storageAdapter) : undefined,
      validateStructure: false,
    })

    if (!result.success && result.error) {
      warning(`Unable to update payload.config.ts: ${result.error.userMessage}`)
    }
  } catch (err: unknown) {
    warning(
      `Unable to update payload.config.ts with plugins: ${err instanceof Error ? err.message : ''}`,
    )
  }
}
