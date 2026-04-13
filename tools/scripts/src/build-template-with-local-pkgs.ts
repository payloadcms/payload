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

  const allFiles = await fs.readdir(templatePath, { withFileTypes: true })
  const allTgzs = allFiles
    .filter((file) => file.isFile())
    .map((file) => file.name)
    .filter((file) => file.endsWith('.tgz'))

  console.log({
    allTgzs,
  })

  // remove node_modules
  await fs.rm(path.join(templatePath, 'node_modules'), { recursive: true, force: true })
  // replace workspace:* from package.json with a real version so that it can be installed with pnpm
  // without this step, even though the packages are built locally as tars
  // it will error as it cannot contain workspace dependencies when installing with --ignore-workspace
  const packageJsonPath = path.join(templatePath, 'package.json')
  const initialPackageJson = await fs.readFile(packageJsonPath, 'utf-8')
  const initialPackageJsonObj = JSON.parse(initialPackageJson)

  // Update the package.json dependencies to use any specific version instead of `workspace:*`, so that
  // the next pnpm add command can install the local packages correctly.
  updatePackageJSONDependencies({ latestVersion: '3.42.0', packageJson: initialPackageJsonObj })

  await fs.writeFile(packageJsonPath, JSON.stringify(initialPackageJsonObj, null, 2))

  execSync('pnpm add ./*.tgz --ignore-workspace', execOpts)
  execSync('pnpm install --ignore-workspace', execOpts)

  const packageJson = await fs.readFile(packageJsonPath, 'utf-8')
  const packageJsonObj = JSON.parse(packageJson) as {
    dependencies: Record<string, string>
    pnpm?: { overrides: Record<string, string> }
  }

  // Get key/value pairs for any package that starts with '@payloadcms'
  const payloadValues =
    packageJsonObj.dependencies &&
    Object.entries(packageJsonObj.dependencies).filter(
      ([key, value]) => key.startsWith('@payloadcms') || key === 'payload',
    )

  // Add each package to the overrides
  const overrides = packageJsonObj.pnpm?.overrides || {}
  payloadValues.forEach(([key, value]) => {
    overrides[key] = value
  })

  // Write package.json back to disk
  packageJsonObj.pnpm = { overrides }
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJsonObj, null, 2))

  execSync('pnpm install --no-frozen-lockfile --ignore-workspace', execOpts)
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
    execSync('pnpm --ignore-workspace run generate:types', execOpts)
    execSync('pnpm --ignore-workspace run generate:importmap', execOpts)
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
    const buildProcess = spawn('pnpm', ['--ignore-workspace', 'run', 'build'], {
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
 * Recursively updates a JSON object to replace all instances of `workspace:` with the latest version pinned.
 *
 * Does not return and instead modifies the `packageJson` object in place.
 */
export function updatePackageJSONDependencies(args: {
  latestVersion: string
  packageJson: Record<string, unknown>
}): void {
  const { latestVersion, packageJson } = args

  const updatedDependencies = Object.entries(packageJson.dependencies || {}).reduce(
    (acc, [key, value]) => {
      if (typeof value === 'string' && value.startsWith('workspace:')) {
        acc[key] = `${latestVersion}`
      } else {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>,
  )
  packageJson.dependencies = updatedDependencies
}
