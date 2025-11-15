import * as fs from 'fs'

import type { DatabaseAdapter } from './types.js'

import { getDbPackageName } from './adapter-config.js'

interface PackageJsonTransformOptions {
  databaseAdapter?: DatabaseAdapter
  packageName?: string
  removeSharp?: boolean
}

interface PackageJsonStructure {
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
    transformed.dependencies = { ...transformed.dependencies }

    // Remove old db adapters
    const allDbAdapters: DatabaseAdapter[] = [
      'mongodb',
      'postgres',
      'sqlite',
      'vercel-postgres',
      'd1-sqlite',
    ]
    allDbAdapters.forEach((adapter) => {
      const pkgName = getDbPackageName(adapter)
      delete transformed.dependencies![pkgName]
    })

    // Add new adapter
    const newAdapter = getDbPackageName(options.databaseAdapter)
    // Get payload version for consistency
    const payloadVersion = transformed.dependencies?.payload || '^3.0.0'
    transformed.dependencies[newAdapter] = payloadVersion

    // Add vercel/postgres if needed
    if (options.databaseAdapter === 'vercel-postgres') {
      transformed.dependencies['@vercel/postgres'] = '^0.10.0'
    }
  }

  // Remove sharp
  if (options.removeSharp && transformed.dependencies) {
    transformed.dependencies = { ...transformed.dependencies }
    delete transformed.dependencies.sharp
  }

  // Update package name
  if (options.packageName) {
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
  // Phase 1: Detection
  const pkg = detectPackageJsonStructure(filePath)

  // Phase 2: Transformation
  const transformed = transformPackageJson(pkg, options)

  // Phase 3: Modification
  writePackageJson(filePath, transformed)
}
