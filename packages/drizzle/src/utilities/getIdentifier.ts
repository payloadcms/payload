import type { DrizzleAdapter } from '../types.js'
import type {
  GetIdentifier,
  IdentifierProps,
  IdentifierTrackers,
  IdentifierType,
} from './getIdentifier.types.js'

import { compressIdentifier } from './compressIdentifier.js'
import { legacyTruncate } from './legacyTruncate.js'

const SCHEMA_TYPES: ReadonlySet<IdentifierType> = new Set(['enum', 'index', 'table'])

export const createGetIdentifier = (adapter: DrizzleAdapter): GetIdentifier => {
  const cache = new Map<string, string>()
  const trackers: IdentifierTrackers = {
    columnsByTable: new Map(),
    fksByTable: new Map(),
    schema: new Map(),
  }

  return (props) => {
    if ('segments' in props) {
      props.segments = props.segments.filter(Boolean)
    }
    // Cache only in compressed mode. compressIdentifier's hash is worth memoizing.
    // Legacy paths either trivially pass through or go through stateful
    // legacyTruncate (which must run per call to increment `_<n>`).
    let cacheKey: null | string = null
    if (adapter.shouldCompressIdentifiers) {
      cacheKey = buildCacheKey(props)
      const cached = cache.get(cacheKey)
      if (cached !== undefined) {
        return cached
      }
    }

    const tracker = pickTracker(props, trackers)
    const maxLen = adapter.maxIdentifierLength

    let name: string
    let fullName: string

    if ('customName' in props) {
      name = props.customName
      fullName = name
      if (name.length > maxLen) {
        adapter.payload.logger.warn(
          `Custom identifier "${name}" exceeds ${maxLen} chars; Your database may truncate or reject it at migrate time.`,
        )
      }
    } else {
      fullName = `${props.segments.join('_')}${props.suffix ?? ''}`

      if (adapter.shouldCompressIdentifiers) {
        name = compressIdentifier({
          maxLength: maxLen,
          segments: props.segments,
          suffix: props.suffix ?? '',
        })
      } else {
        if (props.type === 'index' || props.type === 'fk') {
          name = legacyTruncate({
            blockedNames:
              props.type === 'index' ? new Set(Object.keys(adapter.rawTables)) : undefined,
            body: props.segments.join('_'),
            suffix: props.suffix ?? '',
            tracker: props.type === 'index' ? adapter.indexes : adapter.foreignKeys,
          })
          if (name.length > maxLen) {
            adapter.payload.logger.warn(
              `Identifier "${name}" (from "${fullName}") exceeds ${maxLen} chars. ` +
                `Enable \`shouldCompressIdentifiers\` on the adapter to compress it deterministically.`,
            )
          }
        } else {
          // Tables, enums, columns: plain concat matches pre-refactor behavior —
          // Databases like Postgres silently truncates at its own 63-char NAMEDATALEN. Warn the
          // user so they can proactively enable compression or shorten the name.
          name = fullName
          if (name.length > maxLen) {
            adapter.payload.logger.warn(
              `Identifier "${name}" exceeds ${maxLen} chars. Your database may truncate or reject it at migrate time. ` +
                `Enable \`shouldCompressIdentifiers\` on the adapter to compress it deterministically.`,
            )
          }
        }
      }
    }

    const existingOwner = tracker.get(name)
    if (existingOwner && existingOwner !== props.type) {
      throw new Error(
        `Identifier collision: "${name}" requested as ${props.type}, but already exists as ` +
          `${existingOwner} (from "${fullName}"). Consider setting \`dbName\` on the entity ` +
          `or enabling \`shouldCompressIdentifiers\` on the adapter.`,
      )
    }
    if (!existingOwner) {
      tracker.set(name, props.type)
    }
    if (cacheKey !== null) {
      cache.set(cacheKey, name)
    }
    return name
  }
}

const pickTracker = (
  props: IdentifierProps,
  trackers: IdentifierTrackers,
): Map<string, IdentifierType> => {
  if (SCHEMA_TYPES.has(props.type)) {
    return trackers.schema
  }
  const perTable = props.type === 'column' ? trackers.columnsByTable : trackers.fksByTable
  const parent = (props as { parentTable: string }).parentTable
  let scope = perTable.get(parent)
  if (!scope) {
    scope = new Map()
    perTable.set(parent, scope)
  }
  return scope
}

const buildCacheKey = (props: IdentifierProps): string => {
  const parent = 'parentTable' in props ? props.parentTable : ''
  if ('customName' in props) {
    return `${props.type}|${parent}|c:${props.customName}`
  }
  return `${props.type}|${parent}|s:${JSON.stringify(props.segments)}|${props.suffix ?? ''}`
}
