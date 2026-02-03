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
  /**
   * If the template is part of the workspace, then do not replace the package.json versions
   */
  workspace?: boolean
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
  /**
   * @default false
   */
  skipAgents?: boolean
  storage: StorageAdapterType
  vercelDeployButtonLink?: string
  /**
   * Identify where this template is intended to be deployed.
   * Useful for making some modifications like PNPM's engines config for Vercel.
   *
   * @default 'default'
   */
  targetDeployment?: 'cloudflare' | 'default' | 'vercel'
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
      name: 'with-vercel-postgres',
      db: 'vercel-postgres',
      dirname: 'with-vercel-postgres',
      envNames: {
        // This will replace the process.env.DATABASE_URL to process.env.POSTGRES_URL
        dbUri: 'POSTGRES_URL',
      },
      sharp: false,
      skipDockerCompose: true,
      skipReadme: true,
      skipAgents: false,
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
      name: 'with-vercel-website',
      base: 'website', // This is the base template to copy from
      db: 'vercel-postgres',
      dirname: 'with-vercel-website',
      envNames: {
        // This will replace the process.env.DATABASE_URL to process.env.POSTGRES_URL
        dbUri: 'POSTGRES_URL',
      },
      sharp: true,
      skipDockerCompose: true,
      skipReadme: true,
      skipAgents: false,
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
      name: 'with-postgres',
      db: 'postgres',
      dirname: 'with-postgres',
      sharp: true,
      skipDockerCompose: true,
      skipAgents: false,
      storage: 'localDisk',
    },
    {
      name: 'with-vercel-mongodb',
      db: 'mongodb',
      dirname: 'with-vercel-mongodb',
      envNames: {
        dbUri: 'MONGODB_URL',
      },
      sharp: false,
      storage: 'vercelBlobStorage',
      skipReadme: true,
      skipAgents: false,
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
      sharp: true,
      skipConfig: true, // Do not copy the payload.config.ts file from the base template
      skipReadme: true, // Do not copy the README.md file from the base template
      skipAgents: false,
      storage: 'localDisk',
      // The blank template is used as a base for create-payload-app functionality,
      // so we do not configure the payload.config.ts file, which leaves the placeholder comments.
      configureConfig: false,
      workspace: true,
      base: 'none', // Do not copy from the base _template directory
    },
    {
      name: 'website',
      db: 'mongodb',
      dirname: 'website',
      sharp: true,
      skipConfig: true, // Do not copy the payload.config.ts file from the base template
      skipAgents: false,
      storage: 'localDisk',
      // The blank template is used as a base for create-payload-app functionality,
      // so we do not configure the payload.config.ts file, which leaves the placeholder comments.
      configureConfig: false,
      base: 'none',
      skipDockerCompose: true,
      skipReadme: true,
      workspace: true,
    },
    {
      name: 'ecommerce',
      db: 'mongodb',
      dirname: 'ecommerce',
      sharp: true,
      skipConfig: true, // Do not copy the payload.config.ts file from the base template
      skipAgents: false,
      storage: 'localDisk',
      // The blank template is used as a base for create-payload-app functionality,
      // so we do not configure the payload.config.ts file, which leaves the placeholder comments.
      configureConfig: false,
      base: 'none',
      skipDockerCompose: true,
      skipReadme: true,
      workspace: true,
    },
    {
      name: 'with-cloudflare-d1',
      db: 'd1-sqlite',
      dirname: 'with-cloudflare-d1',
      sharp: false,
      skipConfig: true, // Do not copy the payload.config.ts file from the base template
      skipAgents: false,
      storage: 'r2Storage',
      // The blank template is used as a base for create-payload-app functionality,
      // so we do not configure the payload.config.ts file, which leaves the placeholder comments.
      configureConfig: false,
      base: 'none',
      skipDockerCompose: true,
      skipReadme: true,
      workspace: false,
      targetDeployment: 'cloudflare',
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
      skipAgents = false,
      storage,
      vercelDeployButtonLink,
      targetDeployment = 'default',
      workspace = false,
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

    // Copy _agents files
    if (!skipAgents) {
      await copyAgentsFiles({ destDir })
    }

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
      // Replace DATABASE_URL with the correct env name if set
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

    // Bump package.json versions only in non-workspace templates such as Vercel variants
    // Workspace templates should always continue to point to `workspace:*` version of payload packages
    if (!workspace) {
      await bumpPackageJson({
        templateDir: destDir,
        latestVersion: payloadVersion,
      })
    }

    // Install packages BEFORE running any commands that load the config
    // This ensures all imports in payload.config.ts can be resolved
    log('installing dependencies...')

    execSyncSafe(`pnpm install ${workspace ? '' : '--ignore-workspace'} --no-frozen-lockfile`, {
      cwd: destDir,
    })

    if (!generateLockfile) {
      log('Removing lockfile as per configuration')
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
          DATABASE_URL: process.env.POSTGRES_URL || 'postgres://localhost:5432/your-database-name',
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
    execSyncSafe(`pnpm ${workspace ? '' : '--ignore-workspace '}generate:importmap`, {
      cwd: destDir,
    })

    // Generate types
    log('Generating types')
    execSyncSafe(`pnpm ${workspace ? '' : '--ignore-workspace '}generate:types`, {
      cwd: destDir,
    })

    if (shouldBuild) {
      log('Building...')
      execSyncSafe(`pnpm ${workspace ? '' : '--ignore-workspace '}build`, { cwd: destDir })
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

async function copyAgentsFiles({ destDir }: { destDir: string }) {
  const agentsSourceDir = path.join(TEMPLATES_DIR, '_agents')

  if (!(await fs.stat(agentsSourceDir).catch(() => null))) {
    log(`Skipping agents copy: ${agentsSourceDir} does not exist`)
    return
  }

  log('Copying agents files')

  // Copy AGENTS.md
  const agentsMdSource = path.join(agentsSourceDir, 'AGENTS.md')
  const agentsMdDest = path.join(destDir, 'AGENTS.md')
  if (await fs.stat(agentsMdSource).catch(() => null)) {
    await fs.copyFile(agentsMdSource, agentsMdDest)
    log('Copied AGENTS.md')
  }

  // Copy .cursor directory
  const cursorSourceDir = path.join(agentsSourceDir, 'rules')
  const cursorDestDir = path.join(destDir, '.cursor', 'rules')
  if (await fs.stat(cursorSourceDir).catch(() => null)) {
    await fs.mkdir(path.dirname(cursorDestDir), { recursive: true })
    await fs.cp(cursorSourceDir, cursorDestDir, { recursive: true })
    log('Copied .cursor/rules/')
  }
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
          l.startsWith('#DATABASE_URL=postgresql://'))
      ) {
        return false // Skip this line
      }
      return true // Keep other lines
    })
    .map((l) => {
      if (l.startsWith('DATABASE_URL')) {
        if (dbType === 'mongodb') {
          l = 'MONGODB_URL=mongodb://127.0.0.1/your-database-name'
        }
        // Use db-appropriate connection string
        if (dbType.includes('postgres')) {
          l = 'DATABASE_URL=postgresql://127.0.0.1:5432/your-database-name'
        }

        // Replace DATABASE_URL with the correct env name if set
        if (envNames?.dbUri) {
          l = l.replace('DATABASE_URL', envNames.dbUri)
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
    const response = await fetch(`https://registry.npmjs.org/-/package/${packageName}/dist-tags`)
    const data = await response.json()

    // Monster chaining for type safety just checking for data.latest
    const latestVersion =
      data &&
      typeof data === 'object' &&
      'latest' in data &&
      data.latest &&
      typeof data.latest === 'string'
        ? data.latest
        : null

    log(`Found latest version of ${packageName}: ${latestVersion}`)

    return latestVersion
  } catch (error) {
    console.error('Error fetching Payload version:', error)
    throw error
  }
}
