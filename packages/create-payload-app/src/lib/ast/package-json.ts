import * as fs from 'fs'

import type { DatabaseAdapter } from './types.js'

import { debug } from '../../utils/log.js'
import { getDbPackageName } from './adapter-config.js'

type PackageJsonTransformOptions = {
  databaseAdapter?: DatabaseAdapter
  packageName?: string
  removeSharp?: boolean
}

type PackageJsonStructure = {
  [key: string]: unknown
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  name?: string
}

// Phase 1: Detection
function detectPackageJsonStructure(filePath: string): PackageJsonStructure {
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

// Phase 2: Transformation (pure function)
function transformPackageJson(
  pkg: PackageJsonStructure,
  options: PackageJsonTransformOptions,
): PackageJsonStructure {
  const transformed = { ...pkg }

  // Update database adapter
  if (options.databaseAdapter) {
    debug(`[AST] Updating package.json database adapter to: ${options.databaseAdapter}`)

    transformed.dependencies = { ...transformed.dependencies }

    // Remove old db adapters
    const allDbAdapters: DatabaseAdapter[] = [
      'mongodb',
      'postgres',
      'sqlite',
      'vercel-postgres',
      'd1-sqlite',
    ]
    const removedAdapters: string[] = []
    allDbAdapters.forEach((adapter) => {
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
    const newAdapter = getDbPackageName(options.databaseAdapter)
    // Get payload version for consistency
    const payloadVersion = transformed.dependencies?.payload || '^3.0.0'
    transformed.dependencies[newAdapter] = payloadVersion

    debug(`[AST] Added adapter package: ${newAdapter}`)

    // Add vercel/postgres if needed
    if (options.databaseAdapter === 'vercel-postgres') {
      transformed.dependencies['@vercel/postgres'] = '^0.10.0'
      debug('[AST] Added @vercel/postgres dependency')
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

// Phase 3: Modification
function writePackageJson(filePath: string, pkg: PackageJsonStructure): void {
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n')
}

// Main orchestration function
export function updatePackageJson(filePath: string, options: PackageJsonTransformOptions): void {
  debug(`[AST] Updating package.json: ${filePath}`)

  // Phase 1: Detection
  const pkg = detectPackageJsonStructure(filePath)

  // Phase 2: Transformation
  const transformed = transformPackageJson(pkg, options)

  // Phase 3: Modification
  writePackageJson(filePath, transformed)

  debug('[AST] ✓ package.json updated successfully')
}
