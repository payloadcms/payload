import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { parse } from 'yaml'

/** pnpm catalogs from pnpm-workspace.yaml: the default catalog plus any named ones. */
export type Catalogs = {
  default: Record<string, string>
  named: Record<string, Record<string, string>>
}

/** Reads pnpm-workspace.yaml catalogs. A missing/invalid file yields empty catalogs. */
export const loadCatalogs = async ({ repoRoot }: { repoRoot: string }): Promise<Catalogs> => {
  let raw: string
  try {
    raw = await readFile(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8')
  } catch {
    return { default: {}, named: {} }
  }

  const doc: unknown = parse(raw)
  if (!isRecord(doc)) {
    return { default: {}, named: {} }
  }

  return { default: toStringRecord(doc.catalog), named: toNamedCatalogs(doc.catalogs) }
}

/**
 * Resolves a `catalog:` / `catalog:<name>` spec to its concrete version — what a
 * consumer receives once pnpm substitutes catalog references at publish time.
 * A non-catalog spec, or a catalog reference with no matching entry, is returned
 * unchanged (an unresolved reference then surfaces as an install warning).
 */
export const resolveCatalogSpec = ({
  catalogs,
  name,
  spec,
}: {
  catalogs: Catalogs
  name: string
  spec: string
}): string => {
  if (spec === 'catalog:' || spec === 'catalog:default') {
    return catalogs.default[name] ?? spec
  }
  if (spec.startsWith('catalog:')) {
    const catalogName = spec.slice('catalog:'.length)
    return catalogs.named[catalogName]?.[name] ?? spec
  }
  return spec
}

const toNamedCatalogs = (value: unknown): Record<string, Record<string, string>> => {
  if (!isRecord(value)) {
    return {}
  }
  const result: Record<string, Record<string, string>> = {}
  for (const [name, entries] of Object.entries(value)) {
    result[name] = toStringRecord(entries)
  }
  return result
}

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {}
  }
  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry
    }
  }
  return result
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
