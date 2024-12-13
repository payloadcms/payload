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
  /** Base template to copy from */
  base?: string
  /** Directory in templates dir */
  dirname: string
  db: DbType
  storage: StorageAdapterType
  sharp: boolean
  vercelDeployButtonLink?: string
  envNames?: {
    dbUri: string
  }
  /**
   * @default false
   */
  skipReadme?: boolean
  configureConfig?: boolean
  generateLockfile?: boolean
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const templatesDir = path.resolve(dirname, '../templates')

  // WARNING: This will need to be updated when this merges into main
  const templateRepoUrlBase = `https://github.com/payloadcms/payload/tree/main/templates`

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
      name: 'payload-vercel-website-template',
      base: 'website', // This is the base template to copy from
      dirname: 'with-vercel-website',
      db: 'vercel-postgres',
      storage: 'vercelBlobStorage',
      sharp: true,
      vercelDeployButtonLink:
        `https://vercel.com/new/clone?repository-url=` +
        encodeURI(
          `${templateRepoUrlBase}/with-vercel-website` +
            '&project-name=payload-project' +
            '&env=PAYLOAD_SECRET' +
            '&build-command=pnpm run ci' +
            '&stores=[{"type":"postgres"},{"type":"blob"}]', // Postgres and Vercel Blob Storage
        ),
      envNames: {
        // This will replace the process.env.DATABASE_URI to process.env.POSTGRES_URL
        dbUri: 'POSTGRES_URL',
      },
      skipReadme: true,
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
      generateLockfile: true,
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
      generateLockfile: true,
      storage: 'payloadCloud',
      sharp: true,
    },
  ]

  for (const {
    name,
    base,
    dirname,
    db,
    generateLockfile,
    storage,
    vercelDeployButtonLink,
    envNames,
    sharp,
    configureConfig,
    skipReadme = false,
  } of variations) {
    header(`Generating ${name}...`)
    const destDir = path.join(templatesDir, dirname)
    copyRecursiveSync(path.join(templatesDir, base || '_template'), destDir, [
      'node_modules',
      '\\*\\.tgz',
      '.next',
      '.env$',
      'pnpm-lock.yaml',
      ...(skipReadme ? ['README.md'] : ['']),
    ])

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
        dbType: db,
      })
    }

    if (!skipReadme) {
      await generateReadme({
        destDir,
        data: {
          name,
          description: name, // TODO: Add descriptions
          attributes: { db, storage },
          ...(vercelDeployButtonLink && { vercelDeployButtonLink }),
        },
      })
    }

    if (generateLockfile) {
      log('Generating pnpm-lock.yaml')
      execSyncSafe(`pnpm install --ignore-workspace`, { cwd: destDir })
    } else {
      log('Installing dependencies without generating lockfile')
      execSyncSafe(`pnpm install --ignore-workspace`, { cwd: destDir })
      await fs.rm(`${destDir}/pnpm-lock.yaml`, { force: true })
    }

    // Copy in initial migration if db is postgres. This contains user and media.
    if (db === 'postgres' || db === 'vercel-postgres') {
      // Add "ci" script to package.json
      const packageJsonPath = path.join(destDir, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      packageJson.scripts = packageJson.scripts || {}
      packageJson.scripts.ci = 'payload migrate && pnpm build'
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

      const migrationDestDir = path.join(destDir, 'src/migrations')

      // Delete and recreate migrations directory
      await fs.rm(migrationDestDir, { recursive: true, force: true })
      await fs.mkdir(migrationDestDir, { recursive: true })

      log(`Generating initial migrations in ${migrationDestDir}`)

      execSyncSafe(`pnpm run payload migrate:create initial`, {
        cwd: destDir,
        env: {
          ...process.env,
          PAYLOAD_SECRET: 'asecretsolongnotevensantacouldguessit',
          BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_TEST_asdf',
          DATABASE_URI: process.env.POSTGRES_URL || 'postgres://localhost:5432/payloadtests',
        },
      })
    }

    // TODO: Email?

    // TODO: Sharp?

    log(`Done configuring payload config for ${destDir}/src/payload.config.ts`)
  }
  // TODO: Run prettier manually on the generated files, husky blows up
  log('Running prettier on generated files...')
  execSyncSafe(`pnpm prettier --write templates "*.{js,jsx,ts,tsx}"`)

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
  dbType,
}: {
  destDir: string
  envNames?: TemplateVariations['envNames']
  dbType: DbType
}) {
  const envExamplePath = path.join(destDir, '.env.example')
  const envFileContents = await fs.readFile(envExamplePath, 'utf8')

  const fileContents = envFileContents
    .split('\n')
    .filter((e) => e)
    .map((l) => {
      if (l.startsWith('DATABASE_URI')) {
        // Use db-appropriate connection string
        if (dbType.includes('postgres')) {
          l = 'DATABASE_URI=postgresql://127.0.0.1:5432/payloadtests'
        }

        // Replace DATABASE_URI with the correct env name if set
        if (envNames?.dbUri) {
          l = l.replace('DATABASE_URI', envNames.dbUri)
        }
      }
      return l
    })
    .join('\n')

  console.log(`Writing to ${envExamplePath}`)
  await fs.writeFile(envExamplePath, fileContents)
}

function header(message: string) {
  console.log(chalk.bold.green(`\n${message}\n`))
}

function log(message: string) {
  console.log(chalk.dim(message))
}
function execSyncSafe(command: string, options?: Parameters<typeof execSync>[1]) {
  try {
    console.log(`Executing: ${command}`)
    execSync(command, { stdio: 'inherit', ...options })
  } catch (error) {
    if (error instanceof Error) {
      const stderr = (error as any).stderr?.toString()
      const stdout = (error as any).stdout?.toString()

      if (stderr && stderr.trim()) {
        console.error('Standard Error:', stderr)
      } else if (stdout && stdout.trim()) {
        console.error('Standard Output (likely contains error details):', stdout)
      } else {
        console.error('An unknown error occurred with no output.')
      }
    } else {
      console.error('An unexpected error occurred:', error)
    }
    throw error
  }
}
