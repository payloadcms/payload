import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { updatePackageJson } from './package-json'
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
        '@ruya.sa/db-mongodb': '^3.0.0',
        payload: '^3.0.0',
      },
    }
    fs.writeFileSync(pkgPath, JSON.stringify(originalPkg, null, 2))

    updatePackageJson(pkgPath, {
      databaseAdapter: 'postgres',
    })

    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(updated.dependencies['@ruya.sa/db-postgres']).toBeDefined()
    expect(updated.dependencies['@ruya.sa/db-mongodb']).toBeUndefined()
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
