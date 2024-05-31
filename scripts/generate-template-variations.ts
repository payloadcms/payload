import type { DbType, StorageAdapterType } from 'packages/create-payload-app/src/types.js'

import { configurePayloadConfig } from 'create-payload-app/lib/configure-payload-config.js'
import { copyRecursiveSync } from 'create-payload-app/utils/copy-recursive-sync.js'
import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type TemplateVariations = {
  /** package.json name */
  name: string
  /** Directory in templates dir */
  dirname: string
  db: DbType
  storage: StorageAdapterType
}

async function main() {
  const templatesDir = path.resolve(dirname, '../templates')

  const variations: TemplateVariations[] = [
    {
      name: 'payload-vercel-postgres-template',
      dirname: 'with-vercel-postgres',
      db: 'postgres',
      storage: 'vercelBlobStorage',
    },
    {
      name: 'payload-vercel-mongodb-template',
      dirname: 'with-vercel-mongodb',
      db: 'mongodb',
      storage: 'vercelBlobStorage',
    },
    {
      name: 'payload-cloud-mongodb-template',
      dirname: 'with-payload-cloud',
      db: 'mongodb',
      storage: 'payloadCloud',
    },
  ]

  for (const { name, dirname, db, storage } of variations) {
    console.log(`Generating ${name}...`)
    const destDir = path.join(templatesDir, dirname)
    copyRecursiveSync(path.join(templatesDir, 'blank-3.0'), destDir)
    console.log(`Generated ${name} in ${destDir}`)

    // Configure payload config
    await configurePayloadConfig({
      dbType: db,
      packageJsonName: name,
      projectDirOrConfigPath: { projectDir: destDir },
      storageAdapter: storage,
    })

    console.log(`Done configuring payload config for ${destDir}/src/payload.config.ts`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
