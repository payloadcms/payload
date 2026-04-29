import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type ComponentKind = 'client' | 'server'

/**
 * Classifies a component reference as `'client'` or `'server'` based on the
 * source-text `'use client'` directive.
 *
 * Rules:
 * - If the file's first non-comment, non-blank line is `'use client'` (single
 *   or double quoted, optional trailing semicolon) the module is `'client'`.
 * - Otherwise (no directive present, file unreadable, path unresolvable) the
 *   module is `'server'` — this is the safe default that matches the user
 *   instruction: "Unless a component explicitly has 'use client' directive,
 *   we should treat it as a true server component."
 *
 * Resolution handles three input shapes:
 * 1. Absolute filesystem paths (already canonical).
 * 2. Relative paths starting with `./` or `../`, resolved against
 *    `config.admin.importMap.baseDir` so test-config style refs (e.g.
 *    `./collections/Arrays/ClientTextField.js#ClientTextField`) work.
 * 3. Anything else (tsconfig aliases, package imports) is reported
 *    unresolvable and classifies as `'server'` by default.
 *
 * Component-path strings often carry a `#exportName` suffix and a `.js`
 * extension that doesn't exist on disk (the actual source is `.tsx` / `.ts`).
 * Both are stripped/fanned out automatically.
 */
export async function classifyComponentKind(args: {
  baseDir?: string
  componentPath: string
}): Promise<ComponentKind> {
  const candidates = collectCandidatePaths({
    baseDir: args.baseDir,
    componentPath: args.componentPath,
  })
  if (candidates.length === 0) {
    return 'server'
  }
  const source = await readFirstReadable(candidates)
  if (source === null) {
    return 'server'
  }
  const stripped = stripLeadingCommentsAndBlanks(source)
  if (/^(['"])use client\1\s*;?/.test(stripped)) {
    return 'client'
  }
  return 'server'
}

function collectCandidatePaths({
  baseDir,
  componentPath,
}: {
  baseDir?: string
  componentPath: string
}): string[] {
  // Strip the optional `#exportName` suffix Payload uses for component refs.
  const hashIdx = componentPath.indexOf('#')
  const filePath = hashIdx === -1 ? componentPath : componentPath.slice(0, hashIdx)

  let resolved: null | string = null
  if (path.isAbsolute(filePath)) {
    resolved = filePath
  } else if ((filePath.startsWith('./') || filePath.startsWith('../')) && baseDir) {
    resolved = path.resolve(baseDir, filePath)
  }

  if (!resolved) {
    return []
  }

  // Component refs typically use a `.js` extension because that's what the
  // generated importMap targets, but the on-disk source is `.tsx` / `.ts`.
  // Fan out a small set of common alternates; the first readable one wins.
  if (resolved.endsWith('.js')) {
    const stem = resolved.replace(/\.js$/, '')
    return [resolved, `${stem}.tsx`, `${stem}.ts`, `${stem}.jsx`]
  }
  return [resolved]
}

async function readFirstReadable(candidates: string[]): Promise<null | string> {
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf8')
    } catch {
      // try next candidate
    }
  }
  return null
}

function stripLeadingCommentsAndBlanks(src: string): string {
  let i = 0
  const n = src.length
  if (src.charCodeAt(0) === 0xfeff) {
    i = 1
  }
  while (i < n) {
    const ch = src[i]
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }
    if (src.startsWith('//', i)) {
      while (i < n && src[i] !== '\n') {
        i++
      }
      continue
    }
    if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2)
      if (end === -1) {
        return ''
      }
      i = end + 2
      continue
    }
    break
  }
  return src.slice(i)
}
