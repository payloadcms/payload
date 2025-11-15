import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import { configurePayloadConfig } from '../lib/configure-payload-config'
import type { DbType, StorageAdapterType } from '../types'

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

const DB_ADAPTER_IMPORTS = {
  mongodb: '@payloadcms/db-mongodb',
  postgres: '@payloadcms/db-postgres',
  sqlite: '@payloadcms/db-sqlite',
  'vercel-postgres': '@payloadcms/db-vercel-postgres',
  'd1-sqlite': '@payloadcms/db-sqlite',
} as const

const DB_ADAPTER_NAMES = {
  mongodb: 'mongooseAdapter',
  postgres: 'postgresAdapter',
  sqlite: 'sqliteAdapter',
  'vercel-postgres': 'vercelPostgresAdapter',
  'd1-sqlite': 'sqliteAdapter',
} as const

const STORAGE_ADAPTER_IMPORTS = {
  localDisk: null,
  vercelBlobStorage: '@payloadcms/storage-vercel-blob',
  s3Storage: '@payloadcms/storage-s3',
  r2Storage: '@payloadcms/storage-cloudflare-r2',
  azureStorage: '@payloadcms/storage-azure',
  gcsStorage: '@payloadcms/storage-gcs',
  uploadthingStorage: '@payloadcms/storage-uploadthing',
} as const

const STORAGE_ADAPTER_NAMES = {
  localDisk: null,
  vercelBlobStorage: 'vercelBlobStorage',
  s3Storage: 's3Storage',
  r2Storage: 'r2Storage',
  azureStorage: 'azureStorage',
  gcsStorage: 'gcsStorage',
  uploadthingStorage: 'uploadthingStorage',
} as const

describe('AST Integration Tests', () => {
  let tempDir: string
  const templatesRoot = path.resolve(__dirname, '../../../..', 'templates')

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
      const dbImport = DB_ADAPTER_IMPORTS[dbType]
      const dbAdapterName = DB_ADAPTER_NAMES[dbType]
      expect(configContent).toContain(`from '${dbImport}'`)
      expect(configContent).toContain(`import { ${dbAdapterName} }`)

      // Check database adapter config
      expect(configContent).toMatch(new RegExp(`db:\\s*${dbAdapterName}\\(`))

      // Check storage adapter if not localDisk
      if (storageAdapter !== 'localDisk') {
        const storageImport = STORAGE_ADAPTER_IMPORTS[storageAdapter]
        const storageAdapterName = STORAGE_ADAPTER_NAMES[storageAdapter]

        if (storageImport && storageAdapterName) {
          expect(configContent).toContain(`from '${storageImport}'`)
          expect(configContent).toContain(`import { ${storageAdapterName} }`)
          expect(configContent).toContain(`${storageAdapterName}(`)
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
      expect(packageJson.dependencies[dbImport]).toBeDefined()

      // Check that old db adapters are removed
      Object.entries(DB_ADAPTER_IMPORTS).forEach(([key, pkgName]) => {
        if (key !== dbType && pkgName !== dbImport) {
          expect(packageJson.dependencies[pkgName]).toBeUndefined()
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
