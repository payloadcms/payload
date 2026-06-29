import { TEMPLATES_DIR } from '@tools/constants'
import chalk from 'chalk'
import { execSync, spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const args = process.argv.slice(2)
  const allowWarnings = args.includes('--allow-warnings')
  const positionalArgs = args.filter((arg) => !arg.startsWith('--'))

  const templateName = positionalArgs[0]
  if (!templateName) {
    throw new Error('Please provide a template name')
  }
  const templatePath = path.join(TEMPLATES_DIR, templateName)
  const databaseConnection = positionalArgs[1] || 'mongodb://127.0.0.1/your-database-name'

  console.log({
    templatePath,
    databaseConnection,
  })

  const execOpts = {
    cwd: templatePath,
    stdio: 'inherit' as const,
  }

  // Map every packed .tgz (produced by `script:pack --all`) to its package name and a local
  // `file:` spec, e.g. `@payloadcms/translations` -> `file:./payloadcms-translations-4.0.0.tgz`.
  const allFiles = await fs.readdir(templatePath, { withFileTypes: true })
  const fileSpecByPackageName = Object.fromEntries(
    allFiles
      .filter(
        (file) =>
          file.isFile() &&
          file.name.endsWith('.tgz') &&
          (file.name.startsWith('payload-') || file.name.startsWith('payloadcms-')),
      )
      .map((file) => [tgzToPackageName(file.name), `file:./${file.name}`]),
  )

  if (Object.keys(fileSpecByPackageName).length === 0) {
    throw new Error(
      `No packed .tgz files found in ${templatePath}. Run \`pnpm run script:pack --all --dest ${templatePath}\` first.`,
    )
  }

  console.log({ fileSpecByPackageName })

  await fs.rm(path.join(templatePath, 'node_modules'), { recursive: true, force: true })

  const packageJsonPath = path.join(templatePath, 'package.json')
  const packageJsonObj = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }

  // Point every workspace dependency the template declares at its local tarball. This also
  // replaces `workspace:*` specs, which pnpm cannot install with --ignore-workspace.
  for (const depKey of ['dependencies', 'devDependencies'] as const) {
    const deps = packageJsonObj[depKey]
    if (!deps) {
      continue
    }
    for (const name of Object.keys(deps)) {
      if (fileSpecByPackageName[name]) {
        deps[name] = fileSpecByPackageName[name]
      }
    }
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJsonObj, null, 2))

  /*
   * Make the template its own workspace root (no `--ignore-workspace`, which v11 uses to skip this
   * file entirely). `allowBuilds` is a per-package map honored by v10 and v11; we enumerate instead
   * of `dangerouslyAllowAllBuilds` because the latter conflicts with the templates' package.json
   * `onlyBuiltDependencies` (ERR_PNPM_CONFIG_CONFLICT_BUILT_DEPENDENCIES on the pnpm@10-pinned ones).
   */
  await fs.writeFile(
    path.join(templatePath, 'pnpm-workspace.yaml'),
    toWorkspaceYaml({
      // sharp/esbuild/unrs-resolver: all templates; mongodb-memory-server/@swc/core: plugin template.
      allowBuilds: ['esbuild', 'sharp', 'unrs-resolver', 'mongodb-memory-server', '@swc/core'],
      overrides: fileSpecByPackageName,
    }),
  )

  execSync('pnpm install --no-frozen-lockfile', execOpts)
  await fs.writeFile(
    path.resolve(templatePath, '.env'),
    // Populate POSTGRES_URL just in case it's needed
    `PAYLOAD_SECRET=secret
DATABASE_URL=${databaseConnection}
POSTGRES_URL=${databaseConnection}
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_TEST_asdf`,
  )
  // Important: run generate:types and generate:importmap first
  if (templateName !== 'plugin') {
    // TODO: fix in a separate PR - these commands currently fail in the plugin template
    execSync('pnpm run generate:types', execOpts)
    execSync('pnpm run generate:importmap', execOpts)
  }

  await runBuildWithWarningsCheck({ cwd: templatePath, allowWarnings })

  header(`\n🎉 Done!`)
}

function header(message: string, opts?: { enable?: boolean }) {
  console.log(chalk.bold.green(`${message}\n`))
}

/**
 *
 * Runs the build command and checks for warnings. If there are any warnings, and the user
 * has not allowed them, the build will fail.
 *
 * This ensures that if any new code introduces warnings in the template build process, it will fail our CI.
 * Without this, the warnings will be ignored and the build will pass, even if
 * the new code introduces warnings.
 */
async function runBuildWithWarningsCheck(args: {
  allowWarnings: boolean
  cwd: string
}): Promise<void> {
  const { allowWarnings, cwd } = args

  return new Promise((resolve, reject) => {
    const buildProcess = spawn('pnpm', ['run', 'build'], {
      cwd,
      shell: true,
    })

    let output = ''

    buildProcess.stdout.on('data', (data: Buffer) => {
      process.stdout.write(data)
      output += data.toString()
    })

    buildProcess.stderr.on('data', (data: Buffer) => {
      process.stderr.write(data)
      output += data.toString()
    })

    buildProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build failed with exit code ${code}`))
        return
      }

      if (!allowWarnings && output.includes('Compiled with warnings')) {
        console.error(
          chalk.red(
            '\n❌ Build compiled with warnings. Use --allow-warnings to bypass this check.',
          ),
        )
        reject(new Error('Build compiled with warnings'))
        return
      }

      resolve()
    })
  })
}

/**
 * Serializes the standalone pnpm-workspace.yaml. Omitting `packages` makes the template a
 * single-package workspace root; `verifyDepsBeforeRun: false` stops v11 re-installing before
 * the later `pnpm run` commands. Keys/values are quoted so scoped names and file: specs stay valid.
 */
function toWorkspaceYaml(args: {
  allowBuilds: string[]
  overrides: Record<string, string>
}): string {
  const { allowBuilds, overrides } = args

  const lines = ['verifyDepsBeforeRun: false', 'overrides:']
  for (const [name, spec] of Object.entries(overrides)) {
    lines.push(`  '${name}': '${spec}'`)
  }
  lines.push('allowBuilds:')
  for (const name of allowBuilds) {
    lines.push(`  '${name}': true`)
  }
  return `${lines.join('\n')}\n`
}

/**
 * Derives a package name from a `pnpm pack` tarball filename, e.g.
 * `payload-4.0.0.tgz` -> `payload` and `payloadcms-db-mongodb-4.0.0.tgz` -> `@payloadcms/db-mongodb`.
 * pnpm names scoped tarballs `<scope>-<name>-<version>.tgz`, so the version is the first
 * hyphen-delimited segment that starts with a digit.
 */
export function tgzToPackageName(tgzFileName: string): string {
  const nameWithoutVersion = tgzFileName.replace(/-\d.*\.tgz$/, '')
  return nameWithoutVersion === 'payload'
    ? 'payload'
    : `@payloadcms/${nameWithoutVersion.replace(/^payloadcms-/, '')}`
}
