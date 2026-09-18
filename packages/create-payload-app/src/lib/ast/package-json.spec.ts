import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { preparePackageJson, updatePackageJson } from './package-json'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('updatePackageJson', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('updates database dependencies', () => {
    const pkgPath = path.join(tempDir, 'package.json')
    const originalPkg = {
      name: 'test-app',
      dependencies: {
        '@payloadcms/db-mongodb': '^3.0.0',
        payload: '^3.0.0',
      },
    }
    fs.writeFileSync(pkgPath, JSON.stringify(originalPkg, null, 2))

    updatePackageJson(pkgPath, {
      databaseAdapter: 'postgres',
    })

    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(updated.dependencies['@payloadcms/db-postgres']).toBeDefined()
    expect(updated.dependencies['@payloadcms/db-mongodb']).toBeUndefined()
  })

  it('removes sharp when requested', () => {
    const pkgPath = path.join(tempDir, 'package.json')
    const originalPkg = {
      name: 'test-app',
      dependencies: {
        payload: '^3.0.0',
        sharp: '^0.33.0',
      },
    }
    fs.writeFileSync(pkgPath, JSON.stringify(originalPkg, null, 2))

    updatePackageJson(pkgPath, {
      removeSharp: true,
    })

    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(updated.dependencies.sharp).toBeUndefined()
  })

  it('should remove selected packages from dependencies and devDependencies', () => {
    const pkgPath = path.join(tempDir, 'package.json')
    const originalPkg = {
      name: 'test-app',
      scripts: {
        dev: 'vite',
      },
      dependencies: {
        '@tanstack/router-plugin': '^1.0.0',
        payload: '^4.0.0',
      },
      devDependencies: {
        '@tanstack/router-plugin': '^1.0.0',
        typescript: '^6.0.0',
      },
    }
    fs.writeFileSync(pkgPath, JSON.stringify(originalPkg, null, 2))

    updatePackageJson(pkgPath, {
      removeDependencies: ['@tanstack/router-plugin'],
    })

    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

    expect(updated).toEqual({
      name: 'test-app',
      scripts: {
        dev: 'vite',
      },
      dependencies: {
        payload: '^4.0.0',
      },
      devDependencies: {
        typescript: '^6.0.0',
      },
    })
  })

  it('should prepare exact package content without writing to disk', () => {
    const pkgPath = path.join(tempDir, 'package.json')
    const original = JSON.stringify(
      {
        dependencies: {
          '@tanstack/router-plugin': '^1.0.0',
          payload: '^4.0.0',
        },
        devDependencies: {
          '@tanstack/router-plugin': '^1.0.0',
          typescript: '^6.0.0',
        },
        name: 'router-app',
      },
      null,
      2,
    )
    fs.writeFileSync(pkgPath, original)

    const prepared = preparePackageJson({
      filePath: pkgPath,
      options: { removeDependencies: ['@tanstack/router-plugin'] },
    })

    expect(prepared).toEqual({
      content: `${JSON.stringify(
        {
          dependencies: {
            payload: '^4.0.0',
          },
          devDependencies: {
            typescript: '^6.0.0',
          },
          name: 'router-app',
        },
        null,
        2,
      )}\n`,
      filePath: pkgPath,
    })
    expect(fs.readFileSync(pkgPath, 'utf8')).toBe(original)
  })

  it('updates package name', () => {
    const pkgPath = path.join(tempDir, 'package.json')
    const originalPkg = {
      name: 'template-name',
      dependencies: {
        payload: '^3.0.0',
      },
    }
    fs.writeFileSync(pkgPath, JSON.stringify(originalPkg, null, 2))

    updatePackageJson(pkgPath, {
      packageName: 'my-new-app',
    })

    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(updated.name).toBe('my-new-app')
  })
})
