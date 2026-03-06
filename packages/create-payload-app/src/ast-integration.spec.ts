import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import { configurePayloadConfig } from './lib/configure-payload-config'
import type { DbType, StorageAdapterType } from './types'
import { DB_ADAPTER_CONFIG, STORAGE_ADAPTER_CONFIG } from './lib/ast/adapter-config'

interface TestCase {
  name: string
  template: string
  dbType: DbType
  storageAdapter: StorageAdapterType
}

const TEST_CASES: TestCase[] = [
  {
    name: 'blank + mongodb + localDisk',
    template: 'blank',
    dbType: 'mongodb',
    storageAdapter: 'localDisk',
  },
  {
    name: 'blank + postgres + vercelBlobStorage',
    template: 'blank',
    dbType: 'postgres',
    storageAdapter: 'vercelBlobStorage',
  },
  {
    name: 'website + mongodb + s3Storage',
    template: 'website',
    dbType: 'mongodb',
    storageAdapter: 's3Storage',
  },
  {
    name: 'website + postgres + localDisk',
    template: 'website',
    dbType: 'postgres',
    storageAdapter: 'localDisk',
  },
  {
    name: 'ecommerce + mongodb + localDisk',
    template: 'ecommerce',
    dbType: 'mongodb',
    storageAdapter: 'localDisk',
  },
  {
    name: 'ecommerce + postgres + r2Storage',
    template: 'ecommerce',
    dbType: 'postgres',
    storageAdapter: 'r2Storage',
  },
]

describe('AST Integration Tests', () => {
  let tempDir: string
  const templatesRoot = path.resolve(__dirname, '../../..', 'templates')

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-ast-integration-'))
  })

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe.each(TEST_CASES)('$name', ({ template, dbType, storageAdapter }) => {
    it('successfully applies AST transformations', async () => {
      // Setup: Copy template to temp directory
      const templateDir = path.join(templatesRoot, template)
      const testProjectDir = path.join(tempDir, template)

      if (!fs.existsSync(templateDir)) {
        throw new Error(`Template ${template} not found at ${templateDir}`)
      }

      fse.copySync(templateDir, testProjectDir)

      const payloadConfigPath = path.join(testProjectDir, 'src', 'payload.config.ts')
      const packageJsonPath = path.join(testProjectDir, 'package.json')

      // Verify files exist before transformation
      expect(fs.existsSync(payloadConfigPath)).toBe(true)
      expect(fs.existsSync(packageJsonPath)).toBe(true)

      // Apply transformations
      await configurePayloadConfig({
        dbType,
        storageAdapter,
        projectDirOrConfigPath: { projectDir: testProjectDir },
      })

      // Verify payload.config.ts transformations
      const configContent = fs.readFileSync(payloadConfigPath, 'utf-8')

      // Check database adapter import
      const dbConfig = DB_ADAPTER_CONFIG[dbType]
      expect(configContent).toContain(`from '${dbConfig.packageName}'`)
      expect(configContent).toContain(`import { ${dbConfig.adapterName} }`)

      // Check database adapter config
      expect(configContent).toMatch(new RegExp(`db:\\s*${dbConfig.adapterName}\\(`))

      // Check storage adapter if not localDisk
      if (storageAdapter !== 'localDisk') {
        const storageConfig = STORAGE_ADAPTER_CONFIG[storageAdapter]

        if (storageConfig.packageName && storageConfig.adapterName) {
          expect(configContent).toContain(`from '${storageConfig.packageName}'`)
          expect(configContent).toContain(`import { ${storageConfig.adapterName} }`)
          expect(configContent).toContain(`${storageConfig.adapterName}(`)
        }
      }

      // Check that old mongodb adapter is removed if we switched to postgres
      if (dbType === 'postgres') {
        expect(configContent).not.toContain('@payloadcms/db-mongodb')
        expect(configContent).not.toContain('mongooseAdapter')
      }

      // Check that plugins array exists if storage adapter was added
      if (storageAdapter !== 'localDisk') {
        expect(configContent).toContain('plugins:')
      }

      // Verify package.json transformations
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      // Check that correct db adapter package is in dependencies
      expect(packageJson.dependencies[dbConfig.packageName]).toBeDefined()

      // Check that old db adapters are removed
      Object.entries(DB_ADAPTER_CONFIG).forEach(([key, config]) => {
        if (key !== dbType && config.packageName !== dbConfig.packageName) {
          expect(packageJson.dependencies[config.packageName]).toBeUndefined()
        }
      })

      // Note: Storage adapter dependencies are NOT automatically added to package.json
      // by configurePayloadConfig - only the payload.config.ts is updated.
      // This is expected behavior as storage adapters are typically installed separately.

      // Verify file is valid TypeScript (basic syntax check)
      expect(configContent).toContain('buildConfig')
      expect(configContent).toContain('export default')

      // Verify no placeholder comments remain
      expect(configContent).not.toContain('database-adapter-import')
      expect(configContent).not.toContain('database-adapter-config-start')
      expect(configContent).not.toContain('storage-adapter-placeholder')
    })
  })
})
