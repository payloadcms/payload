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
  const suffix = 'suffix' in props ? (props.suffix ?? '') : ''
  if ('customName' in props) {
    return `${props.type}|${parent}|c:${props.customName}|${suffix}`
  }
  return `${props.type}|${parent}|s:${props.segments.join('\x00')}|${suffix}`
}

export const createGetIdentifier = (adapter: DrizzleAdapter): GetIdentifier => {
  const cache = new Map<string, string>()
  const trackers: IdentifierTrackers = {
    columnsByTable: new Map(),
    fksByTable: new Map(),
    schema: new Map(),
  }

  return (props) => {
    const key = buildCacheKey(props)
    const cached = cache.get(key)
    if (cached !== undefined) {
      return cached
    }

    const tracker = pickTracker(props, trackers)
    const maxLen = adapter.maxIdentifierLength

    let name: string
    let fullName: string

    if ('customName' in props) {
      const suffix = props.suffix ?? ''
      name = `${props.customName}${suffix}`
      fullName = name
      if (name.length > maxLen) {
        adapter.payload.logger.warn(
          `Custom identifier "${name}" exceeds ${maxLen} chars; Postgres will truncate or reject it at migrate time.`,
        )
      }
    } else {
      fullName = `${props.segments.join('_')}${props.suffix ?? ''}`

      if (adapter.shouldCompressIdentifiers) {
        const view = new Set(tracker.keys())
        try {
          name = compressIdentifier({
            maxLength: maxLen,
            segments: props.segments,
            suffix: props.suffix ?? '',
            trackingSet: view,
          })
        } catch (err) {
          if (err instanceof Error && err.message.startsWith('Identifier collision')) {
            throw new Error(
              `${err.message} Requested as ${props.type}; this may include a cross-type conflict. ` +
                `Set \`dbName\` / \`enumName\` on the entity to override.`,
            )
          }
          throw err
        }
      } else {
        if (props.type === 'index' || props.type === 'fk') {
          name = legacyTruncate({
            type: props.type,
            body: props.segments.join('_'),
            maxLength: maxLen,
            suffix: props.suffix ?? '',
            tracker,
          })
          if (name.length > maxLen) {
            adapter.payload.logger.warn(
              `Identifier "${name}" (from "${fullName}") exceeds ${maxLen} chars. ` +
                `Enable \`shouldCompressIdentifiers\` on the adapter to compress it deterministically.`,
            )
          }
        } else {
          // Tables, enums, columns: plain concat matches pre-refactor behavior —
          // Postgres silently truncates at its own 63-char NAMEDATALEN. Warn the
          // user so they can proactively enable compression or shorten the name.
          name = fullName
          if (name.length > maxLen) {
            adapter.payload.logger.warn(
              `Identifier "${name}" exceeds ${maxLen} chars. Postgres will silently truncate it. ` +
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
    cache.set(key, name)
    return name
  }
}
