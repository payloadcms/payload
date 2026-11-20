import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { packagePublishList } from '../src/lib/publishList.ts'

const packageNames = packagePublishList.map((directory) => {
  const packageJson = JSON.parse(
    readFileSync(new URL(`../../../packages/${directory}/package.json`, import.meta.url), 'utf8'),
  )

  return packageJson.name
})

writeFileSync(
  resolve('src/payload-package-names.ts'),
  `// Generated from tools/releaser/src/lib/publishList.ts. Run pnpm build:package-list to update.
export const payloadPackageNames = new Set<string>([
${packageNames
  .sort()
  .map((name) => `  '${name}',`)
  .join('\n')}
])
`,
)
