import fs from 'node:fs/promises'
import path from 'node:path'

import type { PayloadRequest } from '../../types/index.js'
import type { FileToSave } from '../types.js'

export type StagedObject = {
  key: string
  remove: () => Promise<void>
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

type RunFileOperationPlanArgs<T> = {
  req: PayloadRequest
  stage: (args: { trackStagedObject: (object: StagedObject) => void }) => Promise<void>
  write: (args: { trackStagedObject: (object: StagedObject) => void }) => Promise<T>
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

/** Runs cleanup after the outer operation and its database transaction succeed. */
export const deferFileCleanup = async ({
  cleanup,
  req,
}: {
  cleanup: () => Promise<void>
  req: PayloadRequest
}): Promise<void> => {
  const state = getRequestState({ req })
  state.pending.push({ cleanup, staged: new Map() })

  if (state.depth === 0 && (!req.transactionID || state.isCommitted)) {
    await flushCleanup({ req, state })
  }
}

/** Stages owned objects before writing document or version data. */
export const runFileOperationPlan = async <T>({
  req,
  stage,
  write,
}: RunFileOperationPlanArgs<T>): Promise<T> => {
  const requestState = getRequestState({ req })
  const attempt: Attempt = { staged: new Map() }
  let hasStartedWrite = false
  let hasSucceeded = false
  const trackStagedObject = createStagedObjectTracker({ attempt })

  requestState.depth += 1

  try {
    await stage({ trackStagedObject })

    hasStartedWrite = true
    const result = await write({ trackStagedObject })

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
    await finishFileOperation({ hasSucceeded, req, state: requestState })
  }
}

/** Creates use the same rollback and outer-scope compensation without an existing document. */
export const runFileCreationPlan = async <T>({
  req,
  stage,
  write,
}: {
  req: PayloadRequest
  stage: (args: { trackStagedObject: (object: StagedObject) => void }) => Promise<void>
  write: () => Promise<T>
}): Promise<T> => {
  const requestState = getRequestState({ req })
  const attempt: Attempt = { staged: new Map() }
  let hasStartedWrite = false
  let hasSucceeded = false
  const trackStagedObject = createStagedObjectTracker({ attempt })

  requestState.depth += 1

  try {
    await stage({ trackStagedObject })

    hasStartedWrite = true
    const result = await write()

    requestState.pending.push(attempt)
    hasSucceeded = true
    return result
  } catch (err) {
    if (!hasStartedWrite) {
      await compensate({ attempt, req })
    } else if (req.transactionID) {
      requestState.pending.push(attempt)
    }
    throw err
  } finally {
    await finishFileOperation({ hasSucceeded, req, state: requestState })
  }
}

/** Writes each planned local object exclusively and registers only completed writes for rollback. */
export const stageLocalUploadFiles = async ({
  files,
  staticDir,
  trackStagedObject,
}: {
  files: FileToSave[]
  staticDir: string
  trackStagedObject: (object: StagedObject) => void
}): Promise<void> => {
  const directory = path.resolve(staticDir)

  for (const file of files) {
    const destination = path.resolve(file.path)
    const key = path.relative(directory, destination)

    if (!key || key.startsWith('..') || path.isAbsolute(key)) {
      throw new Error('Upload destination is outside its storage directory')
    }

    if ('sourcePath' in file) {
      await fs.copyFile(file.sourcePath, destination, fs.constants.COPYFILE_EXCL)
      trackStagedObject({
        key,
        remove: () => fs.rm(destination, { force: true }),
      })
    } else {
      const handle = await fs.open(destination, 'wx')
      trackStagedObject({
        key,
        remove: () => fs.rm(destination, { force: true }),
      })
      try {
        await handle.writeFile(file.buffer)
      } finally {
        await handle.close()
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

const createStagedObjectTracker =
  ({ attempt }: { attempt: Attempt }) =>
  (object: StagedObject): void => {
    if (attempt.staged.has(object.key)) {
      throw new Error(`Storage object was staged twice: ${object.key}`)
    }

    attempt.staged.set(object.key, object)
  }

const finishFileOperation = async ({
  hasSucceeded,
  req,
  state,
}: {
  hasSucceeded: boolean
  req: PayloadRequest
  state: RequestState
}): Promise<void> => {
  state.depth -= 1

  if (state.depth === 0) {
    if (hasSucceeded && (!req.transactionID || state.isCommitted)) {
      await flushCleanup({ req, state })
    } else if (!req.transactionID) {
      requests.delete(req)
    }
  }
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
        msg: `Failed to remove staged upload file ${object.key}`,
      })
    }
  }
}
