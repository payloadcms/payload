import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const violations = []

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        await visit(entryPath)
        return
      }

      if (!/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) return

      const source = await readFile(entryPath, 'utf8')
      if (/test[\\/]_community|from\s+['"][^'"]*test[\\/]/.test(source)) {
        violations.push(path.relative(root, entryPath))
      }
    }),
  )
}

try {
  await visit(root)
} catch (error) {
  console.error('Unable to inspect template source:', error)
  process.exitCode = 1
}

if (violations.length > 0) {
  console.error(`Template boundary violation in: ${violations.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('Template boundary check passed.')
}
