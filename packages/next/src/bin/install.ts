import fs from 'fs'
import path from 'path'

export const install = (args?: { debug?: boolean }): Promise<void> => {
  const debug = args?.debug
  const useSrc = fs.existsSync(path.resolve(process.cwd(), './src/app'))

  const basePath = useSrc ? './src' : '.'

  const apiTemplateDir = path.resolve(__dirname, '../template/app/api')
  const userApiDir = path.resolve(`${basePath}/app/(payload)/api`)

  if (!fs.existsSync(apiTemplateDir)) {
    console.log(`No api dir found at ${apiTemplateDir}`)
    process.exit(1)
  }

  if (debug) {
    console.log({
      useSrc,
      basePath,
      apiTemplateDir,
      userApiDir,
      cwd: process.cwd(),
    })
  }

  // Merge api dir into user's app/api, user's files take precedence
  copyRecursiveSync(apiTemplateDir, userApiDir, debug)

  process.exit(0)
}

/**
 * Recursively copy files from src to dest, keep user's files
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

const copyFile = (source, target) => {
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, fs.readFileSync(source))
  }
}
