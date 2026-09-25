import { randomUUID } from 'node:crypto'

import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/APIError.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'

type StagedObject = {
  key: string
  remove: () => Promise<void>
  storageBackendId: string
}

type Attempt = {
  cleanup?: () => Promise<void>
  staged: Map<string, StagedObject>
}

type RequestState = {
  depth: number
  isCommitted: boolean
  pending: Attempt[]
}

type FileState = {
  latestVersion: null | string
  revision: null | string
}

type RunFileOperationPlanArgs<T> = {
  cleanup?: () => Promise<void>
  collection: CollectionSlug
  id: number | string
  req: PayloadRequest
  stage: (args: {
    state: FileState
    trackStagedObject: (object: StagedObject) => void
  }) => Promise<void>
  write: () => Promise<T>
}

const requests = new WeakMap<PayloadRequest, RequestState>()

/** Keeps no-transaction cleanup pending until an outer upload operation finishes. */
export const beginFileOperationScope = ({ req }: { req: PayloadRequest }): void => {
  getRequestState({ req }).depth += 1
}

export const completeFileOperationScope = async ({
  req,
}: {
  req: PayloadRequest
}): Promise<void> => {
  const state = requests.get(req)

  if (!state) {
    return
  }

  state.depth -= 1

  if (state.depth === 0 && (!req.transactionID || state.isCommitted)) {
    await flushCleanup({ req, state })
  }
}

export const abortFileOperationScope = ({ req }: { req: PayloadRequest }): void => {
  const state = requests.get(req)

  if (!state) {
    return
  }

  state.depth -= 1

  if (state.depth === 0 && !req.transactionID) {
    requests.delete(req)
  }
}

/**
 * Stages owned objects, then claims the parent upload row before writing document or version data.
 * Every file-changing writer must use this claim, including drafts that leave the published row alone.
 */
export const runFileOperationPlan = async <T>({
  id,
  cleanup,
  collection,
  req,
  stage,
  write,
}: RunFileOperationPlanArgs<T>): Promise<T> => {
  const requestState = getRequestState({ req })
  const attempt: Attempt = { cleanup, staged: new Map() }
  let hasStartedWrite = false
  let hasSucceeded = false

  requestState.depth += 1

  try {
    const state = await readFileState({ id, collection, req })

    await stage({
      state,
      trackStagedObject: (object) => {
        const identity = `${object.storageBackendId}\0${object.key}`

        if (attempt.staged.has(identity)) {
          throw new Error(`Storage object was staged twice: ${object.key}`)
        }

        attempt.staged.set(identity, object)
      },
    })

    let claimed

    try {
      claimed = await req.payload.db.updateOne({
        collection,
        data: { _fileRevision: randomUUID() },
        options: { atomic: true },
        req,
        where: {
          and: [{ id: { equals: id } }, { _fileRevision: { equals: state.revision } }],
        },
      })
    } catch (err) {
      if (isWriteConflict(err)) {
        throw new APIError('The upload changed while its files were being prepared.', 409)
      }

      throw err
    }

    if (!claimed) {
      throw new APIError('The upload changed while its files were being prepared.', 409)
    }

    const latestVersion = await readLatestVersion({ id, collection, req })

    if (latestVersion !== state.latestVersion) {
      throw new APIError('The upload version changed while its files were being prepared.', 409)
    }

    hasStartedWrite = true
    const result = await write()

    requestState.pending.push(attempt)
    hasSucceeded = true

    return result
  } catch (err) {
    if (!hasStartedWrite) {
      await compensate({ attempt, req })
    } else if (req.transactionID) {
      requestState.pending.push({ staged: attempt.staged })
    }

    throw err
  } finally {
    requestState.depth -= 1

    if (requestState.depth === 0) {
      if (hasSucceeded && (!req.transactionID || requestState.isCommitted)) {
        await flushCleanup({ req, state: requestState })
      } else if (!req.transactionID) {
        requests.delete(req)
      }
    }
  }
}

/** Called only after the owning database transaction commits. */
export const commitFileOperations = async ({ req }: { req: PayloadRequest }): Promise<void> => {
  const state = requests.get(req)

  if (!state) {
    return
  }

  state.isCommitted = true

  if (state.depth === 0) {
    await flushCleanup({ req, state })
  }
}

/** Called only after the owning database transaction rolls back. */
export const rollbackFileOperations = async ({ req }: { req: PayloadRequest }): Promise<void> => {
  const state = requests.get(req)

  if (!state) {
    return
  }

  requests.delete(req)

  for (const attempt of state.pending.reverse()) {
    await compensate({ attempt, req })
  }
}

const getRequestState = ({ req }: { req: PayloadRequest }): RequestState => {
  let state = requests.get(req)

  if (!state) {
    state = { depth: 0, isCommitted: false, pending: [] }
    requests.set(req, state)
  }

  return state
}

const readFileState = async ({
  id,
  collection,
  req,
}: {
  collection: CollectionSlug
  id: number | string
  req: PayloadRequest
}): Promise<FileState> => {
  const document = await req.payload.db.findOne({
    collection,
    req,
    where: { id: { equals: id } },
  })

  if (!document) {
    throw new APIError('The upload no longer exists.', 409)
  }

  const revision = (document as { _fileRevision?: unknown })._fileRevision

  return {
    latestVersion: await readLatestVersion({ id, collection, req }),
    revision: typeof revision === 'string' ? revision : null,
  }
}

const readLatestVersion = async ({
  id,
  collection,
  req,
}: {
  collection: CollectionSlug
  id: number | string
  req: PayloadRequest
}): Promise<null | string> => {
  const config = req.payload.collections[collection]?.config

  if (!config?.versions) {
    return null
  }

  const { docs } = await req.payload.db.findVersions({
    collection,
    limit: 1,
    req,
    sort: '-updatedAt',
    where: hasDraftsEnabled(config)
      ? { and: [{ parent: { equals: id } }, { latest: { equals: true } }] }
      : { parent: { equals: id } },
  })
  const latest = docs[0]

  return latest ? JSON.stringify([latest.id, latest.updatedAt, latest.version]) : null
}

const flushCleanup = async ({
  req,
  state,
}: {
  req: PayloadRequest
  state: RequestState
}): Promise<void> => {
  if (req.transactionID && !state.isCommitted) {
    return
  }

  requests.delete(req)

  for (const attempt of state.pending) {
    if (!attempt.cleanup) {
      continue
    }

    try {
      await attempt.cleanup()
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Failed to clean up an unreferenced upload file' })
    }
  }
}

const compensate = async ({
  attempt,
  req,
}: {
  attempt: Attempt
  req: PayloadRequest
}): Promise<void> => {
  for (const object of [...attempt.staged.values()].reverse()) {
    try {
      await object.remove()
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: `Failed to remove staged upload file ${object.storageBackendId}:${object.key}`,
      })
    }
  }
}

const isWriteConflict = (err: unknown): boolean => {
  if (err === null || typeof err !== 'object') {
    return false
  }

  const { code, codeName } = err as { code?: number | string; codeName?: string }

  return (
    code === 112 ||
    codeName === 'WriteConflict' ||
    code === '40001' ||
    code === '40P01' ||
    code === 'SQLITE_BUSY' ||
    code === 'SQLITE_BUSY_SNAPSHOT' ||
    code === 'SQLITE_LOCKED'
  )
}
