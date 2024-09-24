/**
 * This script generates variations of the templates into the `templates` directory.
 *
 * How to use:
 *
 * pnpm run script:gen-templates
 *
 * NOTE: You will likely have to commit by using the `--no-verify` flag to avoid the repo linting
 *       There is no way currently to have lint-staged ignore the templates directory.
 */

import type { DbType, StorageAdapterType } from 'packages/create-payload-app/src/types.js'

import chalk from 'chalk'
import { execSync } from 'child_process'
import { configurePayloadConfig } from 'create-payload-app/lib/configure-payload-config.js'
import { copyRecursiveSync } from 'create-payload-app/utils/copy-recursive-sync.js'
import * as fs from 'node:fs/promises'
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
  sharp: boolean
  vercelDeployButtonLink?: string
  envNames?: {
    dbUri: string
  }
  configureConfig?: boolean
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const templatesDir = path.resolve(dirname, '../templates')

  // WARNING: This will need to be updated when this merges into main
  const templateRepoUrlBase = `https://github.com/payloadcms/payload/tree/beta/templates`

  const variations: TemplateVariations[] = [
    {
      name: 'payload-vercel-postgres-template',
      dirname: 'with-vercel-postgres',
      db: 'vercel-postgres',
      storage: 'vercelBlobStorage',
      sharp: false,
      vercelDeployButtonLink:
        `https://vercel.com/new/clone?repository-url=` +
        encodeURI(
          `${templateRepoUrlBase}/with-vercel-postgres` +
            '&project-name=payload-project' +
            '&env=PAYLOAD_SECRET' +
            '&build-command=pnpm run ci' +
            '&stores=[{"type":"postgres"},{"type":"blob"}]', // Postgres and Vercel Blob Storage
        ),
      envNames: {
        // This will replace the process.env.DATABASE_URI to process.env.POSTGRES_URL
        dbUri: 'POSTGRES_URL',
      },
    },
    {
      name: 'payload-postgres-template',
      dirname: 'with-postgres',
      db: 'postgres',
      storage: 'localDisk',
      sharp: true,
    },
    {
      name: 'payload-vercel-mongodb-template',
      dirname: 'with-vercel-mongodb',
      db: 'mongodb',
      storage: 'vercelBlobStorage',
      sharp: false,
      vercelDeployButtonLink:
        `https://vercel.com/new/clone?repository-url=` +
        encodeURI(
          `${templateRepoUrlBase}/with-vercel-mongodb` +
            '&project-name=payload-project' +
            '&env=PAYLOAD_SECRET' +
            '&build-command=pnpm run ci' +
            '&stores=[{"type":"blob"}]' + // Vercel Blob Storage
            '&integration-ids=oac_jnzmjqM10gllKmSrG0SGrHOH', // MongoDB Atlas
        ),
      envNames: {
        dbUri: 'MONGODB_URI',
      },
    },
    {
      name: 'blank',
      dirname: 'blank',
      db: 'mongodb',
      storage: 'localDisk',
      sharp: true,
      // The blank template is used as a base for create-payload-app functionality,
      // so we do not configure the payload.config.ts file, which leaves the placeholder comments.
      configureConfig: false,
    },
    {
      name: 'payload-cloud-mongodb-template',
      dirname: 'with-payload-cloud',
      db: 'mongodb',
      storage: 'payloadCloud',
      sharp: true,
    },
  ]

  for (const {
    name,
    dirname,
    db,
    storage,
    vercelDeployButtonLink,
    envNames,
    sharp,
    configureConfig,
  } of variations) {
    header(`Generating ${name}...`)
    const destDir = path.join(templatesDir, dirname)
    copyRecursiveSync(path.join(templatesDir, '_template'), destDir)
    log(`Copied to ${destDir}`)

    if (configureConfig !== false) {
      log('Configuring payload.config.ts')
      await configurePayloadConfig({
        dbType: db,
        packageJsonName: name,
        projectDirOrConfigPath: { projectDir: destDir },
        storageAdapter: storage,
        sharp,
        envNames,
      })

      log('Configuring .env.example')
      // Replace DATABASE_URI with the correct env name if set
      await writeEnvExample({
        destDir,
        envNames,
      })
    }

    await generateReadme({
      destDir,
      data: {
        name,
        description: name, // TODO: Add descriptions
        attributes: { db, storage },
        ...(vercelDeployButtonLink && { vercelDeployButtonLink }),
      },
    })

    // Copy in initial migration if db is postgres. This contains user and media.
    if (db === 'postgres' || db === 'vercel-postgres') {
      // Add "ci" script to package.json
      const packageJsonPath = path.join(destDir, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      packageJson.scripts = packageJson.scripts || {}
      packageJson.scripts.ci = 'payload migrate && pnpm build'
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

      // Handle copying migrations
      const migrationSrcDir = path.join(templatesDir, '_data/migrations')
      const migrationDestDir = path.join(destDir, 'src/migrations')

      // Make directory if it doesn't exist
      if ((await fs.stat(migrationDestDir).catch(() => null)) === null) {
        await fs.mkdir(migrationDestDir, { recursive: true })
      }
      log(`Copying migrations from ${migrationSrcDir} to ${migrationDestDir}`)
      copyRecursiveSync(migrationSrcDir, migrationDestDir)

      // Change all '@payloadcms/db-postgres' import to be '@payloadcms/db-vercel-postgres'
      if (db === 'vercel-postgres') {
        const migrationFiles = await fs.readdir(migrationDestDir)
        for (const migrationFile of migrationFiles) {
          const migrationFilePath = path.join(migrationDestDir, migrationFile)
          const migrationFileContents = await fs.readFile(migrationFilePath, 'utf8')
          const updatedFileContents = migrationFileContents.replaceAll(
            '@payloadcms/db-postgres',
            '@payloadcms/db-vercel-postgres',
          )
          await fs.writeFile(migrationFilePath, updatedFileContents)
        }
      }
    }

    // TODO: Email?

    // TODO: Sharp?

    log(`Done configuring payload config for ${destDir}/src/payload.config.ts`)
  }
  // TODO: Run prettier manually on the generated files, husky blows up
  log('Running prettier on generated files...')
  execSync(`pnpm prettier --write templates "*.{js,jsx,ts,tsx}"`)

  log('Template generation complete!')
}

async function generateReadme({
  destDir,
  data: { name, description, attributes, vercelDeployButtonLink },
}: {
  destDir: string
  data: {
    name: string
    description: string
    attributes: Pick<TemplateVariations, 'db' | 'storage'>
    vercelDeployButtonLink?: string
  }
}) {
  let header = `# ${name}\n`
  if (vercelDeployButtonLink) {
    header += `\n[![Deploy with Vercel](https://vercel.com/button)](${vercelDeployButtonLink})`
  }

  const readmeContent = `${header}

${description}

## Attributes

- **Database**: ${attributes.db}
- **Storage Adapter**: ${attributes.storage}
`

  const readmePath = path.join(destDir, 'README.md')
  await fs.writeFile(readmePath, readmeContent)
  log('Generated README.md')
}

async function writeEnvExample({
  destDir,
  envNames,
}: {
  destDir: string
  envNames?: TemplateVariations['envNames']
}) {
  const envExamplePath = path.join(destDir, '.env.example')
  const envFileContents = await fs.readFile(envExamplePath, 'utf8')
  const fileContents = envFileContents
    .split('\n')
    .filter((e) => e)
    .map((l) =>
      envNames?.dbUri && l.startsWith('DATABASE_URI')
        ? l.replace('DATABASE_URI', envNames.dbUri)
        : l,
    )
    .join('\n')

  await fs.writeFile(envExamplePath, fileContents)
}

function header(message: string) {
  console.log(chalk.bold.green(`\n${message}\n`))
}

function log(message: string) {
  console.log(chalk.dim(message))
}
