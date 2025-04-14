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

import type { DbType, StorageAdapterType } from 'create-payload-app/types'

import { PROJECT_ROOT, TEMPLATES_DIR } from '@tools/constants'
import chalk from 'chalk'
import { execSync } from 'child_process'
import { configurePayloadConfig } from 'create-payload-app/lib/configure-payload-config.js'
import { copyRecursiveSync } from 'create-payload-app/utils/copy-recursive-sync.js'
import minimist from 'minimist'
import * as fs from 'node:fs/promises'
import path from 'path'

type TemplateVariation = {
  /** Base template to copy from */
  base?: 'none' | ({} & string)
  configureConfig?: boolean
  db: DbType
  /** Directory in templates dir */
  dirname: string
  envNames?: {
    dbUri: string
  }
  generateLockfile?: boolean
  /** package.json name */
  name: string
  sharp: boolean
  skipConfig?: boolean
  /**
   * @default false
   */
  skipDockerCompose?: boolean
  /**
   * @default false
   */
  skipReadme?: boolean
  storage: StorageAdapterType
  vercelDeployButtonLink?: string
  /**
   * Identify where this template is intended to be deployed.
   * Useful for making some modifications like PNPM's engines config for Vercel.
   *
   * @default 'default'
   */
  targetDeployment?: 'default' | 'vercel'
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const args = minimist(process.argv.slice(2))
  const template = args['template'] // template directory name

  const shouldBuild = args['build']

  const templateRepoUrlBase = `https://github.com/payloadcms/payload/tree/main/templates`

  let variations: TemplateVariation[] = [
    {
      name: 'payload-vercel-postgres-template',
      db: 'vercel-postgres',
      dirname: 'with-vercel-postgres',
      envNames: {
        // This will replace the process.env.DATABASE_URI to process.env.POSTGRES_URL
        dbUri: 'POSTGRES_URL',
      },
      sharp: false,
      skipDockerCompose: true,
      skipReadme: true,
      storage: 'vercelBlobStorage',
      targetDeployment: 'vercel',
      vercelDeployButtonLink:
        `https://vercel.com/new/clone?repository-url=` +
        encodeURI(
          `${templateRepoUrlBase}/with-vercel-postgres` +
            '&project-name=payload-project' +
            '&env=PAYLOAD_SECRET' +
            '&build-command=pnpm run ci' +
            '&stores=[{"type":"postgres"},{"type":"blob"}]', // Postgres and Vercel Blob Storage
        ),
    },
    {
      name: 'payload-vercel-website-template',
      base: 'website', // This is the base template to copy from
      db: 'vercel-postgres',
      dirname: 'with-vercel-website',
      envNames: {
        // This will replace the process.env.DATABASE_URI to process.env.POSTGRES_URL
        dbUri: 'POSTGRES_URL',
      },
      sharp: true,
      skipDockerCompose: true,
      skipReadme: true,
      storage: 'vercelBlobStorage',
      targetDeployment: 'vercel',
      vercelDeployButtonLink:
        `https://vercel.com/new/clone?repository-url=` +
        encodeURI(
          `${templateRepoUrlBase}/with-vercel-website` +
            '&project-name=payload-project' +
            '&env=PAYLOAD_SECRET%2CCRON_SECRET' +
            '&build-command=pnpm run ci' +
            '&stores=[{"type":"postgres"},{"type":"blob"}]', // Postgres and Vercel Blob Storage
        ),
    },
    {
      name: 'payload-postgres-template',
      db: 'postgres',
      dirname: 'with-postgres',
      sharp: true,
      skipDockerCompose: true,
      storage: 'localDisk',
    },
    {
      name: 'payload-vercel-mongodb-template',
      db: 'mongodb',
      dirname: 'with-vercel-mongodb',
      envNames: {
        dbUri: 'MONGODB_URI',
      },
      sharp: false,
      storage: 'vercelBlobStorage',
      skipReadme: true,
      targetDeployment: 'vercel',
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
    },
    {
      name: 'blank',
      db: 'mongodb',
      dirname: 'blank',
      generateLockfile: true,
      sharp: true,
      skipConfig: true, // Do not copy the payload.config.ts file from the base template
      storage: 'localDisk',
      // The blank template is used as a base for create-payload-app functionality,
      // so we do not configure the payload.config.ts file, which leaves the placeholder comments.
      configureConfig: false,
    },
    {
      name: 'website',
      db: 'mongodb',
      dirname: 'website',
      generateLockfile: true,
      sharp: true,
      skipConfig: true, // Do not copy the payload.config.ts file from the base template
      storage: 'localDisk',
      // The blank template is used as a base for create-payload-app functionality,
      // so we do not configure the payload.config.ts file, which leaves the placeholder comments.
      configureConfig: false,
      base: 'none',
      skipDockerCompose: true,
      skipReadme: true,
    },
  ]

  // If template is set, only generate that template
  if (template) {
    const variation = variations.find((v) => v.dirname === template)
    if (!variation) {
      throw new Error(`Variation not found: ${template}`)
    }
    variations = [variation]
  }

  for (const variation of variations) {
    const {
      name,
      base,
      configureConfig,
      db,
      dirname,
      envNames,
      generateLockfile,
      sharp,
      skipConfig = false,
      skipDockerCompose = false,
      skipReadme = false,
      storage,
      vercelDeployButtonLink,
      targetDeployment = 'default',
    } = variation

    header(`Generating ${name}...`)
    const destDir = path.join(TEMPLATES_DIR, dirname)
    if (base !== 'none') {
      copyRecursiveSync(path.join(TEMPLATES_DIR, base || '_template'), destDir, [
        'node_modules',
        '\\*\\.tgz',
        '.next',
        '.env$',
        'pnpm-lock.yaml',
        ...(skipReadme ? ['README.md'] : []),
        ...(skipDockerCompose ? ['docker-compose.yml'] : []),
        ...(skipConfig ? ['payload.config.ts'] : []),
      ])
    }

    log(`Copied to ${destDir}`)

    if (configureConfig !== false) {
      log('Configuring payload.config.ts')
      const configureArgs = {
        dbType: db,
        envNames,
        packageJsonName: name,
        projectDirOrConfigPath: { projectDir: destDir },
        sharp,
        storageAdapter: storage,
      }
      await configurePayloadConfig(configureArgs)

      log('Configuring .env.example')
      // Replace DATABASE_URI with the correct env name if set
      await writeEnvExample({
        dbType: db,
        destDir,
        envNames,
      })
    }

    if (!skipReadme) {
      await generateReadme({
        data: {
          name,
          attributes: { db, storage },
          description: name, // TODO: Add descriptions
          ...(vercelDeployButtonLink && { vercelDeployButtonLink }),
        },
        destDir,
      })
    }

    // Fetch latest npm version of payload package:
    const payloadVersion = await getLatestPackageVersion({ packageName: 'payload' })

    // Bump package.json versions
    await bumpPackageJson({
      templateDir: destDir,
      latestVersion: payloadVersion,
    })

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
      await fs.rm(migrationDestDir, { force: true, recursive: true })
      await fs.mkdir(migrationDestDir, { recursive: true })

      log(`Generating initial migrations in ${migrationDestDir}`)

      execSyncSafe(`pnpm run payload migrate:create initial`, {
        cwd: destDir,
        env: {
          ...process.env,
          BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_TEST_asdf',
          DATABASE_URI: process.env.POSTGRES_URL || 'postgres://localhost:5432/your-database-name',
          PAYLOAD_SECRET: 'asecretsolongnotevensantacouldguessit',
        },
      })
    }

    if (targetDeployment) {
      await handleDeploymentTarget({
        targetDeployment,
        destDir,
      })
    }

    // Generate importmap
    log('Generating import map')
    execSyncSafe(`pnpm --ignore-workspace generate:importmap`, { cwd: destDir })

    if (shouldBuild) {
      log('Building...')
      execSyncSafe(`pnpm --ignore-workspace build`, { cwd: destDir })
    }

    // TODO: Email?

    // TODO: Sharp?

    log(`Done configuring payload config for ${destDir}/src/payload.config.ts`)
  }
  log('Running prettier on generated files...')
  execSyncSafe(`pnpm prettier --write templates "*.{js,jsx,ts,tsx}"`, { cwd: PROJECT_ROOT })

  log('Template generation complete!')
}

async function generateReadme({
  data: { name, attributes, description, vercelDeployButtonLink },
  destDir,
}: {
  data: {
    attributes: Pick<TemplateVariation, 'db' | 'storage'>
    description: string
    name: string
    vercelDeployButtonLink?: string
  }
  destDir: string
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

async function handleDeploymentTarget({
  targetDeployment,
  destDir,
}: {
  targetDeployment: TemplateVariation['targetDeployment']
  destDir: string
}) {
  if (targetDeployment === 'vercel') {
    // Add Vercel specific settings to package.json
    const packageJsonPath = path.join(destDir, 'package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))

    if (packageJson.engines?.pnpm) {
      delete packageJson.engines.pnpm
    }

    const pnpmVersion = await getLatestPackageVersion({ packageName: 'pnpm' })

    packageJson.packageManager = `pnpm@${pnpmVersion}`

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
  }
}

async function writeEnvExample({
  dbType,
  destDir,
  envNames,
}: {
  dbType: DbType
  destDir: string
  envNames?: TemplateVariation['envNames']
}) {
  const envExamplePath = path.join(destDir, '.env.example')
  const envFileContents = await fs.readFile(envExamplePath, 'utf8')

  const fileContents = envFileContents
    .split('\n')
    .filter((l) => {
      // Remove the unwanted PostgreSQL connection comment for "with-vercel-website"
      if (
        dbType === 'vercel-postgres' &&
        (l.startsWith('# Or use a PG connection string') ||
          l.startsWith('#DATABASE_URI=postgresql://'))
      ) {
        return false // Skip this line
      }
      return true // Keep other lines
    })
    .map((l) => {
      if (l.startsWith('DATABASE_URI')) {
        if (dbType === 'mongodb') {
          l = 'MONGODB_URI=mongodb://127.0.0.1/your-database-name'
        }
        // Use db-appropriate connection string
        if (dbType.includes('postgres')) {
          l = 'DATABASE_URI=postgresql://127.0.0.1:5432/your-database-name'
        }

        // Replace DATABASE_URI with the correct env name if set
        if (envNames?.dbUri) {
          l = l.replace('DATABASE_URI', envNames.dbUri)
        }
      }
      return l
    })
    .filter((l) => l.trim() !== '')
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
    log(`Executing: ${command}`)
    execSync(command, { stdio: 'inherit', ...options })
  } catch (error) {
    if (error instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stderr = (error as any).stderr?.toString()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const DO_NOT_BUMP = ['@payloadcms/eslint-config', '@payloadcms/eslint-plugin']
async function bumpPackageJson({
  templateDir,
  latestVersion,
}: {
  templateDir: string
  latestVersion: string
}) {
  const packageJsonString = await fs.readFile(path.resolve(templateDir, 'package.json'), 'utf8')
  const packageJson = JSON.parse(packageJsonString)

  for (const key of ['dependencies', 'devDependencies']) {
    const dependencies = packageJson[key]
    if (dependencies) {
      for (const [packageName, _packageVersion] of Object.entries(dependencies)) {
        if (
          (packageName === 'payload' || packageName.startsWith('@payloadcms')) &&
          !DO_NOT_BUMP.includes(packageName)
        ) {
          dependencies[packageName] = latestVersion
        }
      }
    }
  }

  // write it out
  await fs.writeFile(
    path.resolve(templateDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  )
}

/**
 * Fetches the latest version of a package from the NPM registry.
 *
 * Used in determining the latest version of Payload to use in the generated templates.
 */
async function getLatestPackageVersion({
  packageName = 'payload',
}: {
  /**
   * Package name to fetch the latest version for based on the NPM registry URL
   *
   * Eg. for `'payload'`, it will fetch the version from `https://registry.npmjs.org/payload`
   *
   * @default 'payload'
   */
  packageName?: string
}) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`)
    const data = await response.json()
    const latestVersion = data['dist-tags'].latest

    log(`Found latest version of ${packageName}: ${latestVersion}`)

    return latestVersion
  } catch (error) {
    console.error('Error fetching Payload version:', error)
    throw error
  }
}
