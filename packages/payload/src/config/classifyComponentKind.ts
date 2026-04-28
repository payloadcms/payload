import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { ComponentKind } from './buildComponentIndex.js'

export async function classifyComponentKind(componentPath: string): Promise<ComponentKind> {
  const resolved = tryResolve(componentPath)
  if (!resolved) {
    return 'server'
  }
  try {
    const source = await readFile(resolved, 'utf8')
    const stripped = stripLeadingCommentsAndBlanks(source)
    if (/^(['"])use client\1\s*;?/.test(stripped)) {
      return 'client'
    }
    return 'server'
  } catch {
    return 'server'
  }
}

function tryResolve(p: string): null | string {
  // Phase 1.2 stub: only absolute filesystem paths are resolved.
  // Production-grade resolution (tsconfig aliases, package imports,
  // baseDir-relative paths) is deferred to a follow-up task; unresolvable
  // paths classify as 'server' as the safe default.
  if (path.isAbsolute(p)) {
    return p
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
