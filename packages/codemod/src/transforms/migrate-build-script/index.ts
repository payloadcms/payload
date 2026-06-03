import type { Transform } from '../../types.js'

export const migrateBuildScript: Transform = {
  name: 'migrate-build-script',
  apply: ({ packageJsons }) => {
    const filesChanged: string[] = []

    for (const pkg of packageJsons) {
      const scripts = pkg.data.scripts
      if (!isRecord(scripts) || typeof scripts.build !== 'string') {
        continue
      }

      // Match the `next build` invocation (preceded by start/whitespace, followed
      // by whitespace/end) but not `next build-storybook` or `my-next build`.
      const next = scripts.build.replace(/(?<=^|\s)next build(?=\s|$)/, 'payload build')
      if (next !== scripts.build) {
        scripts.build = next
        filesChanged.push(pkg.path)
      }
    }

    return { filesChanged }
  },
  description:
    'Rewrites the `build` npm script from `next build` to `payload build`, so the Import Map (and types) are generated before the Next.js build.',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
