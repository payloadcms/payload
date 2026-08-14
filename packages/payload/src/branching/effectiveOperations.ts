import type { Payload, PayloadRequest } from '../types/index.js'

import { branchDocIDField, branchField } from './types.js'

/**
 * What a change will actually do to `main` when merged, which is not always what
 * it did on the branch. Editing a published document on a branch is a `publish`
 * against main and needs publish permission; saving a draft on that same
 * document is an ordinary `update` that must leave main's published row alone.
 */
export type EffectiveOperation = 'create' | 'delete' | 'publish' | 'update'

/** One write against main, in the order it must be applied. */
export type EffectiveWrite = {
  /** The document state to write. */
  data: Record<string, unknown>
  /** Whether the write is a draft save rather than a publish. */
  draft: boolean
  operation: EffectiveOperation
}

export type ResolvedChange = {
  change: Record<string, any>
  collectionSlug: string
  docID: number | string
  shadow: null | Record<string, unknown>
  /**
   * Every operation this change performs against main, in order. A branch
   * holding a published state *and* a newer draft on top of it yields two:
   * main genuinely undergoes two transitions.
   */
  writes: EffectiveWrite[]
}

/**
 * Resolves what each pending change will do to main.
 *
 * The shadow row alone cannot answer this. A fork copies main's row wholesale, so
 * a document forked from a published main row carries `_status: 'published'` even
 * when every edit made on the branch was a draft save — and draft saves never
 * touch the main row (§7), so the row still holds main's own pre-fork values.
 * Reading only the row therefore reports a `publish` of values main already has:
 * a merge that claims success and changes nothing.
 *
 * The branch's newest *version* is the missing half. `baseUpdatedAt`, recorded on
 * the registry row at fork time, separates the two cases the row cannot: the
 * shadow row's `updatedAt` still matching it means the branch never published,
 * because only a publish rewrites that row.
 */
export const resolveEffectiveOperations = async ({
  branch,
  changes,
  payload,
  req,
}: {
  branch: string
  changes: Record<string, any>[]
  payload: Payload
  req: PayloadRequest
}): Promise<ResolvedChange[]> => {
  const resolved: ResolvedChange[] = []

  for (const change of changes) {
    const collectionSlug = change.collectionSlug as string
    const docID = change.doc?.value ?? change.doc

    const shadow = (await payload.db.findOne({
      branch: false,
      collection: collectionSlug,
      req,
      where: {
        and: [
          { [branchField]: { equals: branch } },
          { or: [{ id: { equals: docID } }, { [branchDocIDField]: { equals: docID } }] },
        ],
      },
    })) as null | Record<string, unknown>

    resolved.push({
      change,
      collectionSlug,
      docID,
      shadow,
      writes: await resolveWrites({ branch, change, collectionSlug, payload, req, shadow }),
    })
  }

  return resolved
}

const resolveWrites = async ({
  branch,
  change,
  collectionSlug,
  payload,
  req,
  shadow,
}: {
  branch: string
  change: Record<string, any>
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  shadow: null | Record<string, unknown>
}): Promise<EffectiveWrite[]> => {
  if (change.operation === 'delete') {
    return [{ data: {}, draft: false, operation: 'delete' }]
  }

  if (!shadow) {
    return []
  }

  const collectionConfig = payload.collections[collectionSlug]?.config
  const hasDrafts = Boolean(collectionConfig?.versions?.drafts)

  // Without drafts there is no publish to distinguish: every row is live, so the
  // row itself is the whole change and ordinary update permission covers it.
  if (!hasDrafts) {
    return [
      {
        data: shadow,
        draft: false,
        operation: change.operation === 'create' ? 'create' : 'update',
      },
    ]
  }

  const rowIsPublished = isPublished(shadow._status)
  const newerDraft = await findNewerDraft({ collectionSlug, payload, req, shadow })

  if (change.operation === 'create') {
    // A document created on the branch is new to main either way; the row's own
    // status decides whether it arrives published or as a draft.
    const writes: EffectiveWrite[] = [{ data: shadow, draft: !rowIsPublished, operation: 'create' }]

    if (newerDraft) {
      writes.push({ data: newerDraft, draft: true, operation: 'update' })
    }

    return writes
  }

  // Forked. Only a publish rewrites the shadow row, so a row still carrying the
  // `updatedAt` it was forked with means nothing was published on this branch —
  // whatever the branch changed lives entirely in its draft chain, and main's
  // published row must survive the merge untouched.
  //
  // The timestamp is a fast path, not the answer. A fork and the publish that follows it
  // can land in the same millisecond, and then the two are equal for a branch that really
  // did publish — which made the merge apply *nothing at all* while still reporting the
  // change as merged, and consume it. So an equal timestamp falls through to the question
  // it was standing in for: did this branch publish a version of its own?
  const publishedOnBranch =
    rowIsPublished &&
    (!matchesForkPoint({ baseUpdatedAt: change.baseUpdatedAt, shadow }) ||
      (await hasBranchPublishedVersion({ branch, collectionSlug, payload, req, shadow })))

  if (!publishedOnBranch) {
    // Nothing to apply when the branch has neither published nor drafted: the
    // fork itself is not a change to main.
    return newerDraft ? [{ data: newerDraft, draft: true, operation: 'update' }] : []
  }

  const writes: EffectiveWrite[] = [{ data: shadow, draft: false, operation: 'publish' }]

  if (newerDraft) {
    writes.push({ data: newerDraft, draft: true, operation: 'update' })
  }

  return writes
}

/**
 * Whether a row is published, whether or not its status is localized.
 *
 * With localization enabled, `_status` is stored per locale, so a raw row carries an
 * object rather than a string. Read as a scalar it is never `'published'` — which made
 * every publish on a branch look like a fork nobody had touched, so merging a localized
 * document applied **nothing** to main while consuming the change and reporting success.
 *
 * Published in any locale counts. The per-locale writes that follow carry each locale's own
 * status, so this only decides whether a publish is part of the merge at all.
 */
const isPublished = (status: unknown): boolean => {
  if (typeof status === 'object' && status !== null) {
    return Object.values(status as Record<string, unknown>).includes('published')
  }

  return status === 'published'
}

/**
 * Whether this branch published a version of its own for the document.
 *
 * A fork copies the row, not its version chain, so a branch that has only forked owns no
 * versions at all. One carrying a published version of its own has published on the
 * branch, whatever the row's timestamp says.
 */
const hasBranchPublishedVersion = async ({
  branch,
  collectionSlug,
  payload,
  req,
  shadow,
}: {
  branch: string
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  shadow: Record<string, unknown>
}): Promise<boolean> => {
  if (!payload.collections[collectionSlug]?.config.versions) {
    return false
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: collectionSlug,
    limit: 1,
    pagination: false,
    req,
    where: {
      and: [
        { parent: { equals: shadow.id } },
        { [branchField]: { equals: branch } },
        { 'version._status': { equals: 'published' } },
      ],
    },
  })

  return docs.length > 0
}

/**
 * The branch's newest version when it sits above the branch's published row.
 *
 * Returns null when the newest version *is* the published state, so that a
 * publish is not applied twice — once as the row and again as its own version.
 */
const findNewerDraft = async ({
  collectionSlug,
  payload,
  req,
  shadow,
}: {
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  shadow: Record<string, unknown>
}): Promise<null | Record<string, unknown>> => {
  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: collectionSlug,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: { and: [{ latest: { equals: true } }, { parent: { equals: shadow.id } }] },
  })

  const latest = docs?.[0] as { version?: Record<string, unknown> } | undefined
  const version = latest?.version

  if (!version || version._status !== 'draft') {
    return null
  }

  return version
}

/**
 * Whether the shadow row is still exactly as forked.
 *
 * `baseUpdatedAt` is stored as a date and may come back as a `Date` or a string
 * depending on the adapter, so both sides are normalised before comparing.
 */
const matchesForkPoint = ({
  baseUpdatedAt,
  shadow,
}: {
  baseUpdatedAt: unknown
  shadow: Record<string, unknown>
}): boolean => {
  if (!baseUpdatedAt || !shadow.updatedAt) {
    return false
  }

  return toTime(baseUpdatedAt) === toTime(shadow.updatedAt)
}

const toTime = (value: unknown): null | number => {
  const time = new Date(value as string).getTime()

  return Number.isNaN(time) ? null : time
}

/** The distinct operations a change needs permission for. */
export const operationsForChange = (resolved: ResolvedChange): EffectiveOperation[] => [
  ...new Set(resolved.writes.map((write) => write.operation)),
]
