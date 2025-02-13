import { TEMPLATES_DIR } from '@tools/constants'
import chalk from 'chalk'
import { exec as execOrig, execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const templateName = process.argv[2]
  if (!templateName) {
    throw new Error('Please provide a template name')
  }
  const templatePath = path.join(TEMPLATES_DIR, templateName)
  const databaseConnection = process.argv[3] || 'mongodb://127.0.0.1/your-database-name'

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

  execSync('pnpm add ./*.tgz --ignore-workspace', execOpts)
  execSync('pnpm install --ignore-workspace', execOpts)

  const packageJsonPath = path.join(templatePath, 'package.json')
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

  execSync('pnpm install --ignore-workspace --no-frozen-lockfile', execOpts)
  await fs.writeFile(
    path.resolve(templatePath, '.env'),
    // Populate POSTGRES_URL just in case it's needed
    `PAYLOAD_SECRET=secret
DATABASE_URI=${databaseConnection}
POSTGRES_URL=${databaseConnection}
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_TEST_asdf`,
  )
  execSync('pnpm run build', execOpts)

  header(`\n🎉 Done!`)
}

function header(message: string, opts?: { enable?: boolean }) {
  console.log(chalk.bold.green(`${message}\n`))
}
