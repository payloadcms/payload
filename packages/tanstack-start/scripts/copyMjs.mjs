/**
 * Copies non-TypeScript runtime artefacts (currently the Node ESM loader
 * shims under `src/node/`) into `dist/` after `swc` has compiled the
 * TypeScript sources.
 *
 * `swc` only emits `.ts`/`.tsx`/`.js`/`.jsx` outputs and silently drops
 * everything else, so plain `.mjs` files have to be copied through a
 * separate post-build step. Centralising this in one script keeps the
 * build chain's `package.json` declaration short and readable.
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pkgRoot = path.resolve(__dirname, '..')

const srcDir = path.join(pkgRoot, 'src', 'node')
const destDir = path.join(pkgRoot, 'dist', 'node')

await mkdir(destDir, { recursive: true })

const entries = await readdir(srcDir)
for (const entry of entries) {
  if (!entry.endsWith('.mjs')) {
    continue
  }
  await copyFile(path.join(srcDir, entry), path.join(destDir, entry))
}
