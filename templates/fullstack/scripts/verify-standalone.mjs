import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateRoot = path.resolve(__dirname, '..')

console.log('--- Verifying Fullstack Template Standalone Integrity ---')

// 1. Required standalone files
const requiredFiles = [
  '.env.example',
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'next-env.d.ts',
  'eslint.config.mjs',
  'README.md',
  'MIGRATION.md',
  'vitest.config.ts',
  'src/payload.config.ts',
  'src/app/(frontend)/page.tsx',
  'src/app/(frontend)/layout.tsx',
  'src/app/(payload)/admin/[[...segments]]/page.tsx',
  'src/app/(payload)/admin/importMap.js',
  'src/app/posts/[slug]/page.tsx',
  'src/collections/Posts/index.ts',
  'src/collections/Users/index.ts',
  'src/collections/Categories/index.ts',
  'src/collections/Media/index.ts',
  'src/blocks/Hero.ts',
  'src/blocks/FeatureGrid.ts',
  'src/blocks/CallToAction.ts',
  'src/components/blocks/RenderBlocks.tsx',
  'src/components/RichText/index.tsx',
  'src/utilities/safeHref.ts',
]

for (const relPath of requiredFiles) {
  const fullPath = path.join(templateRoot, relPath)
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: Missing required file: ${relPath}`)
    process.exit(1)
  }
}
console.log(`PASS: All ${requiredFiles.length} required standalone files exist.`)

// 2. Package manifest verification
const pkgPath = path.join(templateRoot, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const requiredDeps = [
  '@payloadcms/db-mongodb',
  '@payloadcms/next',
  '@payloadcms/richtext-lexical',
  '@payloadcms/ui',
  'next',
  'payload',
  'react',
  'react-dom',
]

for (const dep of requiredDeps) {
  if (!pkg.dependencies[dep]) {
    console.error(`FAIL: Missing dependency: ${dep}`)
    process.exit(1)
  }
}
console.log(`PASS: All ${requiredDeps.length} required dependencies declared in package.json.`)

// 3. Check for forbidden external references in template files
const srcDir = path.join(templateRoot, 'src')
function checkNoMonorepoCoupling(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      checkNoMonorepoCoupling(full)
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8')
      if (content.includes('test/_community') || content.includes('../../../packages/')) {
        console.error(`FAIL: Coupled monorepo import found in ${path.relative(templateRoot, full)}`)
        process.exit(1)
      }
    }
  }
}
checkNoMonorepoCoupling(srcDir)
console.log('PASS: Zero coupled monorepo imports in template src/.')

// 4. Turbopack root verification
const nextConfigPath = path.join(templateRoot, 'next.config.ts')
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8')
if (nextConfigContent.includes("turbopack: { root: path.resolve(dirname, '../..') }")) {
  console.error('FAIL: next.config.ts should use local dirname root for standalone portability.')
  process.exit(1)
}
console.log('PASS: next.config.ts uses local template root for standalone compilation.')

console.log('--- Fullstack Template Standalone Integrity Verified Successfully ---')
