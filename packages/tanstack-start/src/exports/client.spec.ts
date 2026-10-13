import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Packages a file reaches through static runtime imports (no `import type`, no `import()`). */
function getStaticPackageImports(entry: string): Set<string> {
  const packages = new Set<string>()
  const seen = new Set<string>()
  const stack = [entry]
  while (stack.length) {
    const file = stack.pop()!
    if (seen.has(file)) {
      continue
    }
    seen.add(file)
    const code = fs.readFileSync(file, 'utf8')
    for (const [, specifier] of code.matchAll(
      /^(?:import|export)\s+(?!type\b)(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/gm,
    )) {
      if (!specifier!.startsWith('.')) {
        packages.add(specifier!)
        continue
      }
      const base = path.resolve(path.dirname(file), specifier!).replace(/\.js$/, '')
      const resolved = ['.ts', '.tsx'].map((ext) => base + ext).find((f) => fs.existsSync(f))
      if (resolved) {
        stack.push(resolved)
      }
    }
  }
  return packages
}

describe('@payloadcms/tanstack-start/client', () => {
  // The root route and every Payload route file import this entry, so everything it imports
  // statically loads on front-end routes too. The admin UI must only load through lazy imports.
  it('should not statically import the @payloadcms/ui barrel', () => {
    const packages = getStaticPackageImports(path.join(srcDir, 'exports/client.ts'))

    expect(packages).toContain('@tanstack/react-router')
    expect(packages).not.toContain('@payloadcms/ui')
  })
})
