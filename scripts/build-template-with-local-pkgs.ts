import chalk from 'chalk'
import { exec as execOrig, execSync } from 'child_process'
import fs from 'fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const templateDir = path.resolve(dirname, '../templates')
  const templateName = process.argv[2]
  const templatePath = path.join(templateDir, templateName)
  console.log({
    templatePath,
  })

  const allFiles = await fs.readdir(templatePath, { withFileTypes: true })
  const allTgzs = allFiles
    .filter((file) => file.isFile())
    .map((file) => file.name)
    .filter((file) => file.endsWith('.tgz'))

  console.log({
    allTgzs,
  })

  execSync('pnpm add ./*.tgz --ignore-workspace', { cwd: templatePath, stdio: 'inherit' })
  execSync('pnpm install --ignore-workspace', { cwd: templatePath, stdio: 'inherit' })

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

  execSync('pnpm install --ignore-workspace', { cwd: templatePath, stdio: 'inherit' })
  execSync('pnpm run build', { cwd: templatePath, stdio: 'inherit' })

  header(`\n🎉 Done!`)
}

function header(message: string, opts?: { enable?: boolean }) {
  console.log(chalk.bold.green(`${message}\n`))
}
