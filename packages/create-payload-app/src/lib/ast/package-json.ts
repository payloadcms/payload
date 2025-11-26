import * as fs from 'fs'

import type { DatabaseAdapter, StorageAdapter } from './types.js'

import { debug } from '../../utils/log.js'
import { getDbPackageName, getStoragePackageName } from './adapter-config.js'
import { ALL_DATABASE_ADAPTERS, ALL_STORAGE_ADAPTERS } from './types.js'

type PackageJsonTransformOptions = {
  databaseAdapter?: DatabaseAdapter
  packageName?: string
  removeSharp?: boolean
  storageAdapter?: StorageAdapter
}

type PackageJsonStructure = {
  [key: string]: unknown
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  name?: string
}

/**
 * Main orchestration function
 */
export function updatePackageJson(filePath: string, options: PackageJsonTransformOptions): void {
  debug(`[AST] Updating package.json: ${filePath}`)

  // Phase 1: Detection
  const pkg = parsePackageJson(filePath)

  // Phase 2: Transformation
  const transformed = transformPackageJson(pkg, options)

  // Phase 3: Modification
  writePackageJson(filePath, transformed)

  debug('[AST] ✓ package.json updated successfully')
}

// Helper functions

function parsePackageJson(filePath: string): PackageJsonStructure {
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 *  Transforms the package.json based upon provided options
 */
function transformPackageJson(
  pkg: PackageJsonStructure,
  options: PackageJsonTransformOptions,
): PackageJsonStructure {
  const transformed = { ...pkg }

  // Update database adapter
  if (options.databaseAdapter) {
    debug(`[AST] Updating package.json database adapter to: ${options.databaseAdapter}`)

    transformed.dependencies = { ...transformed.dependencies }

    const removedAdapters: string[] = []
    ALL_DATABASE_ADAPTERS.forEach((adapter) => {
      const pkgName = getDbPackageName(adapter)
      if (transformed.dependencies![pkgName]) {
        removedAdapters.push(pkgName)
      }
      delete transformed.dependencies![pkgName]
    })

    if (removedAdapters.length > 0) {
      debug(`[AST] Removed old adapter packages: ${removedAdapters.join(', ')}`)
    }

    // Add new adapter
    const dbAdapterPackageName = getDbPackageName(options.databaseAdapter)
    const payloadVersion = transformed.dependencies?.payload || '^3.0.0'
    transformed.dependencies[dbAdapterPackageName] = payloadVersion

    debug(`[AST] Added adapter package: ${dbAdapterPackageName}`)
  }

  // Update storage adapter
  if (options.storageAdapter) {
    debug(`[AST] Updating package.json storage adapter to: ${options.storageAdapter}`)

    transformed.dependencies = { ...transformed.dependencies }

    const removedAdapters: string[] = []
    ALL_STORAGE_ADAPTERS.forEach((adapter) => {
      const pkgName = getStoragePackageName(adapter)
      if (pkgName && transformed.dependencies![pkgName]) {
        removedAdapters.push(pkgName)
      }
      if (pkgName) {
        delete transformed.dependencies![pkgName]
      }
    })

    if (removedAdapters.length > 0) {
      debug(`[AST] Removed old storage adapter packages: ${removedAdapters.join(', ')}`)
    }

    // Add new storage adapter (if not localDisk)
    const storagePackageName = getStoragePackageName(options.storageAdapter)
    if (storagePackageName) {
      const payloadVersion = transformed.dependencies?.payload || '^3.0.0'
      transformed.dependencies[storagePackageName] = payloadVersion
      debug(`[AST] Added storage adapter package: ${storagePackageName}`)
    } else {
      debug(`[AST] Storage adapter is localDisk, no package needed`)
    }
  }

  // Remove sharp
  if (options.removeSharp && transformed.dependencies) {
    transformed.dependencies = { ...transformed.dependencies }
    if (transformed.dependencies.sharp) {
      delete transformed.dependencies.sharp
      debug('[AST] Removed sharp dependency')
    } else {
      debug('[AST] Sharp dependency not found (already absent)')
    }
  }

  // Update package name
  if (options.packageName) {
    debug(`[AST] Updated package name to: ${options.packageName}`)
    transformed.name = options.packageName
  }

  return transformed
}

function writePackageJson(filePath: string, pkg: PackageJsonStructure): void {
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n')
}
