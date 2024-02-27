import fs from 'fs'
import path from 'path'

export const install = (args?: { debug?: boolean }): Promise<void> => {
  const debug = args?.debug

  const nextConfigPath = path.resolve(process.cwd(), 'next.config.js')
  if (!fs.existsSync(nextConfigPath)) {
    console.log(`No next.config.js found at ${nextConfigPath}`)
    process.exit(1)
  }

  const apiTemplateDir = path.resolve(__dirname, '../..', 'dist', 'template/app/(payload)')
  const userProjectDir = process.cwd()

  if (!fs.existsSync(apiTemplateDir)) {
    console.log(`Could not find template source files from ${apiTemplateDir}`)
    process.exit(1)
  }

  if (!fs.existsSync(path.resolve(userProjectDir, 'app'))) {
    console.log(`Could not find user app directory at ${userProjectDir}/app`)
    process.exit(1)
  }

  const templateFileDest = path.resolve(userProjectDir, 'app/(payload)')

  if (debug) {
    console.log({
      cwd: process.cwd(),

      // Paths
      apiTemplateDir,
      templateFileDest,
      userProjectDir,
    })
  }

  // Merge api dir into user's app/api, user's files take precedence
  copyRecursiveSync(apiTemplateDir, templateFileDest, debug)
  process.exit(0)
}

/**
 * Recursively copy files from src to dest
 */
function copyRecursiveSync(src: string, dest: string, debug?: boolean) {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory()
  if (isDirectory) {
    if (debug) console.log(`Dir: ${src}\n--Dest: ${dest}`)
    fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName))
    })
  } else {
    if (debug) console.log(`File: ${src}\n--Dest: ${dest}`)
    fs.copyFileSync(src, dest)
  }
}

if (require.main === module) {
  install({ debug: true }).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
