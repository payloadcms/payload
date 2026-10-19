import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..')
// Overridable so tests can copy into a scratch dir instead of the real dist/.
const distBase = process.env.CODEMOD_DIST_DIR ? process.env.CODEMOD_DIST_DIR : join(pkgDir, 'dist')
const distRunbook = join(distBase, 'runbook')
mkdirSync(distRunbook, { recursive: true })

// Hand-written checklist(s).
cpSync(join(pkgDir, 'src', 'runbook'), distRunbook, { recursive: true })

// Canonical migration guide, copied from the monorepo (never committed to src/).
const guide = join(pkgDir, '..', '..', 'docs', 'migration-guide', 'v4.mdx')
if (existsSync(guide)) {
  copyFileSync(guide, join(distRunbook, 'v4.mdx'))
} else {
  console.warn(`copy-migration-guide: ${guide} not found; shipping runbook without bundled v4.mdx.`)
}
