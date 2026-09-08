import execa from 'execa'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, expect, it } from 'vitest'

import { updatePackageJSONDependencies } from '../../../packages/create-payload-app/src/lib/create-project.js'
import { describe } from '../../__helpers/int/vitest.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '../../..')
const oldVersion = '3.86.0'
const newVersion = '4.0.0-canary.18'
const projectDir = await mkdtemp(path.join(tmpdir(), 'payload-jobs-v4-upgrade-'))

afterAll(async () => {
  await rm(projectDir, { force: true, recursive: true })
})

describe('jobs v4 upgrade migration', { db: (adapter) => adapter === 'sqlite' }, () => {
  it('should upgrade a project created before the jobs v4 database changes', async () => {
    await createOldProject()
    await runCommand({
      args: ['install', '--no-frozen-lockfile'],
      command: 'pnpm',
    })
    await expectInstalledPayloadVersion({ version: oldVersion })
    await runProjectScript({ mode: 'seed', shouldPushSchema: true })

    await usePayloadVersion({ version: newVersion })
    await runCommand({
      args: ['install', '--no-frozen-lockfile'],
      command: 'pnpm',
    })
    await expectInstalledPayloadVersion({ version: newVersion })

    const beforeMigration = await runProjectScript({
      mode: 'verify',
      reject: false,
      shouldPushSchema: false,
    })

    expect(beforeMigration.exitCode).not.toBe(0)
    expect(`${beforeMigration.stdout}\n${beforeMigration.stderr}`).toMatch(
      /no such (?:column|table)/i,
    )

    const predefinedMigrationPath = await createPredefinedMigration()

    await runCommand({
      args: [
        'exec',
        'payload',
        'migrate:create',
        '--file',
        predefinedMigrationPath,
        '--force-accept-warning',
      ],
      command: 'pnpm',
      shouldPushSchema: false,
    })
    await runCommand({
      args: ['exec', 'payload', 'migrate'],
      command: 'pnpm',
      input: 'y\n',
      shouldPushSchema: false,
    })

    const afterMigration = await runProjectScript({
      mode: 'verify',
      shouldPushSchema: false,
    })

    expect(afterMigration.stdout).toContain('Verified migrated jobs project')
  }, 600_000)
})

async function createOldProject(): Promise<void> {
  await writeFile(
    path.join(projectDir, 'package.json'),
    JSON.stringify(
      {
        name: 'payload-jobs-v4-upgrade-test',
        type: 'module',
        dependencies: {
          '@payloadcms/db-sqlite': oldVersion,
          graphql: '16.8.1',
          payload: oldVersion,
          tsx: '4.22.4',
        },
        packageManager: 'pnpm@11.9.0',
        private: true,
      },
      null,
      2,
    ),
  )
  await writeFile(
    path.join(projectDir, 'pnpm-workspace.yaml'),
    `packages:
  - '.'

dangerouslyAllowAllBuilds: true
`,
  )
  await writeFile(
    path.join(projectDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          target: 'ES2022',
        },
      },
      null,
      2,
    ),
  )
  await writeFile(
    path.join(projectDir, 'payload.config.ts'),
    `import { sqliteAdapter } from '@payloadcms/db-sqlite'
import path from 'node:path'
import { buildConfig } from 'payload'

export default buildConfig({
  admin: {
    disable: true,
  },
  collections: [],
  db: sqliteAdapter({
    client: {
      url: 'file:./payload.db',
    },
    migrationDir: path.resolve('migrations'),
    push: process.env.PAYLOAD_PUSH === 'true',
  }),
  jobs: {
    deleteJobOnComplete: false,
    tasks: [
      {
        slug: 'upgradeTest',
        inputSchema: [
          {
            name: 'message',
            required: true,
            type: 'text',
          },
        ],
        outputSchema: [],
        handler: async ({ input }) => {
          return {
            output: {
              message: input.message,
            },
          }
        },
      },
    ],
  },
  secret: 'jobs-v4-upgrade-test-secret',
})
`,
  )
  await writeFile(
    path.join(projectDir, 'verify.ts'),
    `import config from './payload.config.ts'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const mode = process.argv[2]

try {
  if (mode === 'seed') {
    await payload.jobs.queue({
      input: {
        message: 'queued before upgrade',
      },
      task: 'upgradeTest',
    })
    console.log('Seeded old jobs project')
  } else if (mode === 'verify') {
    const jobsBeforeRun = await payload.find({
      collection: 'payload-jobs',
      limit: 10,
    })

    if (jobsBeforeRun.totalDocs !== 1) {
      throw new Error(\`Expected one queued job, found \${jobsBeforeRun.totalDocs}\`)
    }

    await payload.jobs.run({
      limit: 10,
    })

    const jobsAfterRun = await payload.find({
      collection: 'payload-jobs',
      limit: 10,
    })
    const migratedJob = jobsAfterRun.docs[0]

    if (!migratedJob?.completedAt || migratedJob.log?.[0]?.input?.message !== 'queued before upgrade') {
      throw new Error('The migrated job did not run with its original input')
    }

    await payload.findGlobal({
      slug: 'payload-jobs-stats',
    })

    console.log('Verified migrated jobs project')
  } else {
    throw new Error(\`Unknown mode: \${mode}\`)
  }
} finally {
  await payload.destroy()
}
`,
  )
}

/**
 * The npm-pinned application contains the schema changes, while this unmerged migration only
 * exists in the current checkout. Expose that implementation through the same package subpath
 * generated migrations use without replacing any of the application's pinned Payload packages.
 */
async function createPredefinedMigration(): Promise<string> {
  const migrationImplementation = pathToFileURL(
    path.join(projectRoot, 'packages/drizzle/src/utilities/jobsV4Migration.ts'),
  ).href
  const migrationPackageName = 'jobs-v4-migration-test'
  const migrationPackagePath = path.join(projectDir, 'node_modules', migrationPackageName)
  const predefinedMigrationPath = path.join(projectDir, 'jobs-v4-predefined.ts')

  await mkdir(migrationPackagePath, { recursive: true })
  await writeFile(
    path.join(migrationPackagePath, 'package.json'),
    JSON.stringify({
      name: migrationPackageName,
      type: 'module',
      exports: {
        './migration-utils': './migration-utils.js',
      },
    }),
  )
  await writeFile(
    path.join(migrationPackagePath, 'migration-utils.js'),
    `export { migrateJobsV4 } from ${JSON.stringify(migrationImplementation)}
`,
  )
  await writeFile(
    predefinedMigrationPath,
    `import { buildDynamicPredefinedJobsV4Migration } from ${JSON.stringify(migrationImplementation)}

export const dynamic = buildDynamicPredefinedJobsV4Migration({
  dialect: 'sqlite',
  packageName: ${JSON.stringify(migrationPackageName)},
})
`,
  )

  return predefinedMigrationPath
}

async function expectInstalledPayloadVersion({ version }: { version: string }): Promise<void> {
  const installedPackages = [
    path.join(projectDir, 'node_modules/payload/package.json'),
    path.join(projectDir, 'node_modules/@payloadcms/db-sqlite/package.json'),
  ]

  for (const packageJSONPath of installedPackages) {
    const packageJSON = JSON.parse(await readFile(packageJSONPath, 'utf8')) as { version: string }

    expect(packageJSON.version).toBe(version)
  }
}

async function runCommand({
  args,
  command,
  cwd = projectDir,
  input,
  reject = true,
  shouldPushSchema,
}: {
  args: string[]
  command: string
  cwd?: string
  input?: string
  reject?: boolean
  shouldPushSchema?: boolean
}) {
  return execa(command, args, {
    cwd,
    env: {
      ...process.env,
      PAYLOAD_DROP_DATABASE: 'false',
      ...(typeof shouldPushSchema === 'boolean' ? { PAYLOAD_PUSH: String(shouldPushSchema) } : {}),
    },
    input,
    reject,
    timeout: 180_000,
  })
}

async function runProjectScript({
  mode,
  reject,
  shouldPushSchema,
}: {
  mode: 'seed' | 'verify'
  reject?: boolean
  shouldPushSchema: boolean
}) {
  return runCommand({
    args: ['exec', 'tsx', 'verify.ts', mode],
    command: 'pnpm',
    reject,
    shouldPushSchema,
  })
}

async function usePayloadVersion({ version }: { version: string }): Promise<void> {
  const packageJSONPath = path.join(projectDir, 'package.json')
  const packageJSON = JSON.parse(await readFile(packageJSONPath, 'utf8')) as {
    dependencies: Record<string, string>
  }

  updatePackageJSONDependencies({
    latestVersion: version,
    packageJson: packageJSON,
  })

  await writeFile(packageJSONPath, JSON.stringify(packageJSON, null, 2))
}
