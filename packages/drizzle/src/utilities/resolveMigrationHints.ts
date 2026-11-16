import prompts from 'prompts'

import type { DrizzleMigrationHint, DrizzleSnapshotJSON } from '../types.js'

/**
 * An entity identifier as drizzle-kit reports it, e.g. `['public', 'posts', 'title']` for a column.
 * SQLite entities use `'public'` as their schema.
 */
export type DrizzleEntityID = readonly string[]

export type RenameOrCreateMissingHint = {
  entity: DrizzleEntityID
  kind: string
  type: 'rename_or_create'
}

export type ConfirmDataLossMissingHint = {
  entity: DrizzleEntityID
  kind: string
  reason?: string
  type: 'confirm_data_loss'
}

export type DrizzleMissingHint = ConfirmDataLossMissingHint | RenameOrCreateMissingHint

export type DroppedEntity = {
  entity: DrizzleEntityID
  kind: string
}

export type ChooseRenameSource = (args: {
  candidates: DroppedEntity[]
  hint: RenameOrCreateMissingHint
}) => Promise<DroppedEntity | null>

export type ConfirmDataLoss = (args: { hints: ConfirmDataLossMissingHint[] }) => Promise<boolean>

type Args<T> = {
  /**
   * Asks whether an ambiguous entity was renamed. Return `null` to create it. When omitted,
   * ambiguous entities that have rename candidates cause an error.
   */
  chooseRenameSource?: ChooseRenameSource
  /** Resolves data-loss confirmations. When omitted, data-loss errors are rethrown. */
  confirmDataLoss?: ConfirmDataLoss
  /**
   * Returns the entities removed by this change, used as rename candidates. Receives the hints
   * gathered so far and the ambiguous entities that still need a decision.
   */
  getDroppedEntities: (args: {
    hints: DrizzleMigrationHint[]
    pending: RenameOrCreateMissingHint[]
  }) => DroppedEntity[] | Promise<DroppedEntity[]>
  /** Hints known before the first attempt, e.g. renames inverted from an UP migration. */
  initialHints?: DrizzleMigrationHint[]
  run: (hints: DrizzleMigrationHint[]) => Promise<T>
}

/**
 * drizzle-kit v1 no longer prompts when it cannot tell whether an entity was renamed or created,
 * or when a change loses data. It throws a `missing_hints` error instead, and expects the caller
 * to supply the decisions as hints. This retries `run` until every decision is resolved.
 */
export const resolveMigrationHints = async <T>({
  chooseRenameSource,
  confirmDataLoss,
  getDroppedEntities,
  initialHints = [],
  run,
}: Args<T>): Promise<T> => {
  const hints: DrizzleMigrationHint[] = [...initialHints]
  const resolvedKeys = new Set<string>(hints.map(getHintKey))

  while (true) {
    let missingHints: DrizzleMissingHint[] | undefined

    try {
      return await run([...hints])
    } catch (error) {
      missingHints = getMissingHints({ error })

      if (!missingHints) {
        throw error
      }

      const unresolved = missingHints.filter((hint) => !resolvedKeys.has(getHintKey(hint)))

      if (!unresolved.length) {
        throw error
      }

      const pending = unresolved.filter(
        (hint): hint is RenameOrCreateMissingHint => hint.type === 'rename_or_create',
      )

      if (pending.length) {
        const dropped = await getDroppedEntities({ hints: [...hints], pending })
        const usedSources = new Set(
          hints.flatMap((hint) =>
            hint.type === 'rename' ? [getEntityKey(hint.kind, hint.from)] : [],
          ),
        )

        for (const hint of pending) {
          const candidates = dropped.filter(
            (candidate) =>
              candidate.kind === hint.kind &&
              isSameParent(candidate.entity, hint.entity) &&
              !usedSources.has(getEntityKey(candidate.kind, candidate.entity)),
          )

          let source: DroppedEntity | null = null

          if (candidates.length) {
            if (!chooseRenameSource) {
              throw new Error(
                `Unable to tell whether ${describeEntity(hint)} was renamed or newly created. ` +
                  `Run this command interactively to choose.`,
              )
            }

            source = await chooseRenameSource({ candidates, hint })
          }

          if (source) {
            usedSources.add(getEntityKey(source.kind, source.entity))
            hints.push({ type: 'rename', from: source.entity, kind: hint.kind, to: hint.entity })
          } else {
            hints.push({ type: 'create', entity: hint.entity, kind: hint.kind })
          }

          resolvedKeys.add(getHintKey(hint))
        }

        // Renames can change which data-loss confirmations are needed, so ask again first.
        continue
      }

      const dataLoss = unresolved as ConfirmDataLossMissingHint[]

      if (!confirmDataLoss || !(await confirmDataLoss({ hints: dataLoss }))) {
        throw error
      }

      for (const hint of dataLoss) {
        hints.push({ type: 'confirm_data_loss', entity: hint.entity, kind: hint.kind })
        resolvedKeys.add(getHintKey(hint))
      }
    }
  }
}

/** Maps drizzle-kit hint kinds to the `entityType` used in DDL snapshots. */
const entityTypeByKind: Record<string, string> = {
  check: 'checks',
  column: 'columns',
  enum: 'enums',
  'foreign key': 'fks',
  index: 'indexes',
  policy: 'policies',
  primary_key: 'pks',
  role: 'roles',
  schema: 'schemas',
  sequence: 'sequences',
  table: 'tables',
  unique: 'uniques',
  view: 'views',
}

const rootKinds = new Set(['role', 'schema'])
const schemaKinds = new Set(['enum', 'sequence', 'table', 'view'])

/** Lists the entities present in `before` but missing from `after`, as drizzle-kit identifies them. */
export const getDroppedSnapshotEntities = ({
  after,
  before,
}: {
  after: DrizzleSnapshotJSON
  before: DrizzleSnapshotJSON
}): DroppedEntity[] => {
  const getEntities = (snapshot: DrizzleSnapshotJSON): DroppedEntity[] =>
    (snapshot.ddl ?? []).flatMap((entity) => {
      const kind = Object.keys(entityTypeByKind).find(
        (key) => entityTypeByKind[key] === entity.entityType,
      )

      if (!kind || !entity.name) {
        return []
      }

      const schema = entity.schema || 'public'

      if (rootKinds.has(kind)) {
        return [{ entity: [entity.name], kind }]
      }

      if (schemaKinds.has(kind)) {
        return [{ entity: [schema, entity.name], kind }]
      }

      return entity.table ? [{ entity: [schema, entity.table, entity.name], kind }] : []
    })

  const afterKeys = new Set(
    getEntities(after).map(({ entity, kind }) => getEntityKey(kind, entity)),
  )

  return getEntities(before).filter(
    ({ entity, kind }) => !afterKeys.has(getEntityKey(kind, entity)),
  )
}

/** Lists the entities drizzle-kit would drop, taken from its data-loss confirmations. */
export const getDroppedEntitiesFromError = ({ error }: { error: unknown }): DroppedEntity[] => {
  const missingHints = getMissingHints({ error })

  if (!missingHints) {
    throw error
  }

  return missingHints
    .filter((hint) => hint.type === 'confirm_data_loss')
    .map(({ entity, kind }) => ({ entity, kind }))
}

/** Inverts UP hints so the DOWN migration reverses the same renames without asking again. */
export const invertMigrationHints = ({
  hints,
}: {
  hints: DrizzleMigrationHint[]
}): DrizzleMigrationHint[] =>
  hints.flatMap((hint): DrizzleMigrationHint[] =>
    hint.type === 'rename' ? [{ ...hint, from: hint.to, to: hint.from }] : [],
  )

export const promptRenameSource: ChooseRenameSource = async ({ candidates, hint }) => {
  const name = hint.entity.at(-1)

  const { source } = await prompts(
    {
      name: 'source',
      type: 'select',
      choices: [
        { description: `create ${hint.kind}`, title: `+ ${name}`, value: null },
        ...candidates.map((candidate) => ({
          description: `rename ${hint.kind}`,
          title: `~ ${candidate.entity.at(-1)} › ${name}`,
          value: candidate,
        })),
      ],
      message: `Is ${describeEntity(hint)} created or renamed from another ${hint.kind}?`,
    },
    {
      onCancel: () => {
        process.exit(0)
      },
    },
  )

  return source ?? null
}

export const promptDataLoss: ConfirmDataLoss = async ({ hints }) => {
  const { confirm } = await prompts(
    {
      name: 'confirm',
      type: 'confirm',
      initial: false,
      message: `DATA LOSS WARNING: these changes may delete data:\n\n${hints
        .map((hint) => `  - ${describeEntity(hint)}${hint.reason ? ` (${hint.reason})` : ''}`)
        .join('\n')}\n\nAccept and continue?`,
    },
    {
      onCancel: () => {
        process.exit(0)
      },
    },
  )

  return Boolean(confirm)
}

const getMissingHints = ({ error }: { error: unknown }): DrizzleMissingHint[] | undefined => {
  if (
    !error ||
    typeof error !== 'object' ||
    !('code' in error) ||
    error.code !== 'missing_hints' ||
    !('missingHints' in error) ||
    !Array.isArray(error.missingHints)
  ) {
    return undefined
  }

  const isKnownHint = (hint: unknown): hint is DrizzleMissingHint =>
    !!hint &&
    typeof hint === 'object' &&
    'type' in hint &&
    (hint.type === 'rename_or_create' || hint.type === 'confirm_data_loss') &&
    'kind' in hint &&
    typeof hint.kind === 'string' &&
    'entity' in hint &&
    Array.isArray(hint.entity) &&
    hint.entity.every((part) => typeof part === 'string')

  return error.missingHints.every(isKnownHint) ? error.missingHints : undefined
}

const getEntityKey = (kind: string, entity: DrizzleEntityID) => JSON.stringify([kind, entity])

const getHintKey = (hint: DrizzleMigrationHint | DrizzleMissingHint) => {
  if (hint.type === 'rename') {
    return JSON.stringify(['rename_or_create', hint.kind, hint.to])
  }

  const type = hint.type === 'confirm_data_loss' ? hint.type : 'rename_or_create'

  return JSON.stringify([type, hint.kind, hint.entity])
}

const isSameParent = (a: DrizzleEntityID, b: DrizzleEntityID) =>
  a.length === b.length && a.slice(0, -1).every((part, index) => part === b[index])

const describeEntity = ({ entity, kind }: { entity: DrizzleEntityID; kind: string }) => {
  const [name] = entity.slice(-1)
  const parent = entity.slice(0, -1).filter((part) => part !== 'public')

  return `${kind} "${name}"${parent.length ? ` in "${parent.join('.')}"` : ''}`
}
