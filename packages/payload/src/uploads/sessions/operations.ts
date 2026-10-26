import path from 'node:path'

import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { UploadInstructions } from '../types.js'
import type {
  ClientUploadSession,
  SegmentedUploadCapability,
  UploadSegment,
  UploadSegmentRequest,
  UploadSessionDoc,
  UploadSessionError,
  UploadSessionOperation,
} from './types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { createOperation } from '../../collections/operations/create.js'
import { updateByIDOperation } from '../../collections/operations/updateByID.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { assertClientUploadAllowed } from '../assertClientUploadAllowed.js'
import { checkFileMetadataRestrictions } from '../checkFileRestrictions.js'
import { createClientUploadReceipt } from '../clientUploadReceipt.js'
import { getFileFromUploadInstructions } from '../getFileFromUploadInstructions.js'
import { uploadRequiresServerValidation } from '../getFileTypeIdentity.js'
import { planSegments } from './planSegments.js'
import { uploadSessionsCollectionSlug } from './slug.js'

const DEFAULT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000
const DEFAULT_MAX_ACTIVE = 10
const FINALIZE_LEASE_MS = 10 * 60 * 1000
const INSTRUCTION_EXPIRES_IN_SECONDS = 15 * 60
const MAX_INTENT_BYTES = 256 * 1024
const SWEEP_BATCH_SIZE = 10

const slug = uploadSessionsCollectionSlug as CollectionSlug

export type CreateUploadSessionArgs = {
  collectionSlug: string
  docPrefix?: string
  file: {
    filename: string
    lastModified?: number
    mimeType: string
    size: number
  }
  operation: UploadSessionOperation
  req: PayloadRequest
  targetID?: string
}

/**
 * Starts a durable upload. Every check that does not contact storage runs first, so a refused
 * request leaves nothing behind. The session is then persisted before storage is contacted so an
 * initiated provider upload can never become untracked. A temporary initiation failure is retried
 * by the next instructions request; a permanent one marks the session `failed`.
 */
export const createUploadSession = async ({
  collectionSlug,
  docPrefix,
  file,
  operation,
  req,
  targetID,
}: CreateUploadSessionArgs): Promise<ClientUploadSession> => {
  const owner = getOwner(req)
  const { collection, segmented } = getSegmentedCollection({ collectionSlug, req })

  if (operation === 'update' && !targetID) {
    throw new APIError('Replacing a file requires a target document ID.', 400)
  }

  await assertTargetAccess({ collectionSlug, operation, req, targetID })
  await segmented.authorize?.({ collectionSlug, req })

  assertClientUploadAllowed({
    collection: collection.config,
    filename: file.filename,
    mimeType: file.mimeType,
  })

  if (
    uploadRequiresServerValidation({
      allowRestrictedFileTypes: collection.config.upload.allowRestrictedFileTypes,
      filename: file.filename,
      mimeType: file.mimeType,
    })
  ) {
    throw new APIError('This file type must be uploaded through Payload.', 400)
  }

  const fileSizeLimit = req.payload.config.upload.limits?.fileSize

  if (fileSizeLimit && fileSizeLimit !== Infinity && file.size > fileSizeLimit) {
    throw new APIError('Exceeded file size limit.', 400)
  }

  await checkFileMetadataRestrictions({
    collection: collection.config,
    filename: file.filename,
    filesize: file.size,
    mimeType: file.mimeType,
    req,
  })

  await sweepUploadSessions({ req })

  const { totalDocs: activeSessionCount } = await req.payload.db.count({
    collection: slug,
    req,
    where: {
      and: [ownerWhere(owner), { status: { in: ['pending', 'active'] } }],
    },
  })

  const maxActive = req.payload.config.upload.sessions?.maxActive ?? DEFAULT_MAX_ACTIVE

  if (activeSessionCount >= maxActive) {
    throw new APIError(
      `You have ${activeSessionCount} unfinished uploads. Finish or cancel one to start another.`,
      429,
    )
  }

  const { concurrency, segments } = planSegments({
    collectionTransfer: collection.config.upload.transfer,
    globalTransfer: req.payload.config.upload.transfer,
    limits: segmented.limits,
    size: file.size,
  })

  const now = new Date()
  const expiresIn = req.payload.config.upload.sessions?.expiresIn ?? DEFAULT_EXPIRES_IN

  let session = (await req.payload.db.create({
    collection: slug,
    data: {
      collectionSlug,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + expiresIn).toISOString(),
      file: {
        filename: file.filename,
        lastModified: file.lastModified,
        mimeType: file.mimeType,
        size: file.size,
      },
      lastActivityAt: now.toISOString(),
      operation,
      ownerCollection: owner.ownerCollection,
      ownerID: owner.ownerID,
      status: 'pending',
      storage: { docPrefix, object: null, providerState: null },
      targetID: targetID ?? null,
      transfer: { concurrency, segments, strategy: 'segmented' },
      updatedAt: now.toISOString(),
    },
    req,
  })) as UploadSessionDoc

  try {
    session = await ensureInitiated({ req, segmented, session })
  } catch (err) {
    const isPermanent = isPermanentError(err)

    if (!(err instanceof APIError)) {
      req.payload.logger.error({ err, msg: 'Failed to initiate upload session storage' })
    }

    session = await recordError({
      error: toSessionError({ err, retryable: !isPermanent, source: 'adapter' }),
      req,
      session,
    })

    if (isPermanent) {
      await updateSession({ data: { status: 'failed' }, req, session })
      throw err
    }
  }

  return toClientSession({ session })
}

export const getUploadSession = async ({
  id,
  req,
}: {
  id: string
  req: PayloadRequest
}): Promise<ClientUploadSession> => {
  const session = await reconcileClaimedObject({
    req,
    session: await findOwnedSession({ id, req }),
  })

  return toClientSession({ session })
}

/** Returns the current user's unfinished sessions. */
export const listUploadSessions = async ({
  req,
}: {
  req: PayloadRequest
}): Promise<ClientUploadSession[]> => {
  const owner = getOwner(req)

  await sweepUploadSessions({ req })

  const { docs } = await req.payload.db.find<UploadSessionDoc>({
    collection: slug,
    limit: 0,
    pagination: false,
    req,
    sort: '-lastActivityAt',
    where: { and: [ownerWhere(owner), { status: { in: ['pending', 'active'] } }] },
  })

  const sessions: ClientUploadSession[] = []

  for (const doc of docs) {
    const session = await reconcileClaimedObject({ req, session: doc })

    if (session.status === 'pending' || session.status === 'active') {
      sessions.push(toClientSession({ session }))
    }
  }

  return sessions
}

/**
 * Returns signed requests for the next window of segments the provider has not confirmed.
 * Progress always comes from provider reconciliation, never from the client.
 */
export const getUploadSessionInstructions = async ({
  id,
  req,
}: {
  id: string
  req: PayloadRequest
}): Promise<{ requests: UploadSegmentRequest[]; session: ClientUploadSession }> => {
  let session = await findOwnedSession({ id, req })

  assertResumable({ session })
  await assertSessionAccess({ req, session })

  const { segmented } = getSegmentedCollection({ collectionSlug: session.collectionSlug, req })

  session = await ensureInitiated({ req, segmented, session })

  if (session.storageCompletedAt) {
    return { requests: [], session: toClientSession({ session }) }
  }

  const storage = getInitiatedStorage({ session })
  const reconciled = await segmented.reconcile({ ...storage, req })

  const missingSegments = getMissingSegments({ reconciled, segments: session.transfer.segments })
  const windowSize = session.transfer.concurrency * 2

  const requests = missingSegments.length
    ? await segmented.getSegmentRequests({
        collectionSlug: session.collectionSlug,
        expiresIn: INSTRUCTION_EXPIRES_IN_SECONDS,
        mimeType: session.file.mimeType,
        ...storage,
        req,
        segments: missingSegments.slice(0, windowSize),
      })
    : []

  session = await updateSession({
    data: { error: null, lastActivityAt: new Date().toISOString(), status: 'active' },
    req,
    session,
  })

  return {
    requests,
    session: toClientSession({ reconciled, session }),
  }
}

/**
 * Commits the provider upload and returns a file reference for a normal document create or
 * update request. Safe to call repeatedly: once storage is complete it only mints a new receipt.
 */
export const completeUploadSessionStorage = async ({
  id,
  req,
}: {
  id: string
  req: PayloadRequest
}): Promise<{ file: UploadInstructions['file']; session: ClientUploadSession }> => {
  let session = await findOwnedSession({ id, req })

  assertResumable({ session })
  await assertSessionAccess({ req, session })

  // Once storage is committed this only mints a fresh receipt, so concurrent calls are safe.
  if (!session.storageCompletedAt) {
    session = await claimFinalization({ req, session })

    try {
      session = await commitStorage({ req, session })
    } finally {
      session = await updateSession({ data: { finalizingUntil: null }, req, session })
    }
  }

  return { file: createFileReference({ req, session }), session: toClientSession({ session }) }
}

/**
 * Stores document data the user has already submitted while the upload is still running, so the
 * save can be finished by `completeUploadSession` after navigation or a reload. This is
 * submitted data, not a draft of unsaved form state.
 */
export const setUploadSessionIntent = async ({
  id,
  data,
  draft,
  req,
}: {
  data: Record<string, unknown>
  draft?: boolean
  id: string
  req: PayloadRequest
}): Promise<ClientUploadSession> => {
  const session = await findOwnedSession({ id, req })

  assertResumable({ session })
  await assertSessionAccess({ req, session })

  if (new TextEncoder().encode(JSON.stringify(data)).byteLength > MAX_INTENT_BYTES) {
    throw new APIError('Document data is too large to keep with the upload.', 413)
  }

  return toClientSession({
    session: await updateSession({
      data: { intent: { data, draft, submittedAt: new Date().toISOString() } },
      req,
      session,
    }),
  })
}

/**
 * Commits storage and creates or updates the target document in one call. Used by bulk upload
 * and by recovery after a reload, where there is no form submit to carry the file reference.
 * Without `data`, the intent stored by `setUploadSessionIntent` is used.
 */
export const completeUploadSession = async ({
  id,
  data: dataArg,
  draft: draftArg,
  req,
}: {
  data?: Record<string, unknown>
  draft?: boolean
  id: string
  req: PayloadRequest
}): Promise<{ doc: Record<string, unknown>; session: ClientUploadSession }> => {
  let session = await findOwnedSession({ id, req })

  if (session.status === 'completed' && session.documentID) {
    return {
      doc: await findTargetDocument({ id: session.documentID, req, session }),
      session: toClientSession({ session }),
    }
  }

  assertResumable({ session })
  await assertSessionAccess({ req, session })

  const { data, draft } = dataArg ? { data: dataArg, draft: draftArg } : (session.intent ?? {})

  if (!data) {
    throw new APIError('Document data is required to finish this upload.', 400)
  }

  session = await claimFinalization({ req, session })

  try {
    session = await commitStorage({ req, session })

    // A previous attempt may have created the document and crashed before recording it.
    const claimedDocument = await findDocumentByObjectKey({ req, session })

    if (claimedDocument) {
      session = await markCompleted({ documentID: String(claimedDocument.id), req, session })

      return {
        doc: await findTargetDocument({ id: String(claimedDocument.id), req, session }),
        session: toClientSession({ session }),
      }
    }

    const collection = req.payload.collections[session.collectionSlug]!

    req.file = await getFileFromUploadInstructions({
      collectionSlug: session.collectionSlug,
      file: createFileReference({ req, session }),
      req,
    })

    const doc =
      session.operation === 'create'
        ? await createOperation({ collection, data: data as never, draft, req })
        : await updateByIDOperation({
            id: session.targetID!,
            collection,
            data: data as never,
            draft,
            req,
          })

    session = await markCompleted({ documentID: String(doc.id), req, session })

    return { doc, session: toClientSession({ session }) }
  } catch (err) {
    session = await recordError({
      error: toSessionError({ err, source: 'payload' }),
      req,
      session,
    })
    throw err
  } finally {
    // Release the claim. A `failed` session (e.g. a size mismatch) stays failed.
    if (session.status === 'active') {
      await updateSession({ data: { finalizingUntil: null, status: 'pending' }, req, session })
    }
  }
}

/** Cancels an unfinished session and releases provider storage. Provider not-found counts as success. */
export const cancelUploadSession = async ({
  id,
  req,
}: {
  id: string
  req: PayloadRequest
}): Promise<ClientUploadSession> => {
  // The object may already belong to a document created through a normal form submit.
  const session = await reconcileClaimedObject({
    req,
    session: await findOwnedSession({ id, req }),
  })

  if (session.status === 'completed') {
    throw new APIError('A completed upload cannot be cancelled.', 409)
  }

  if (session.status === 'cancelled') {
    return toClientSession({ session })
  }

  const cancelledSession = await updateSession({
    data: {
      cancelledAt: new Date().toISOString(),
      cancelReason: 'user',
      intent: null,
      status: 'cancelled',
    },
    req,
    session,
  })

  return toClientSession({
    session: await cleanupSessionStorage({ req, session: cancelledSession }),
  })
}

/**
 * Expires overdue sessions and retries unfinished provider cleanup in a bounded batch. Runs
 * opportunistically on session create and list so cleanup works without a jobs runner.
 */
export const sweepUploadSessions = async ({
  limit = SWEEP_BATCH_SIZE,
  req,
}: {
  limit?: number
  req: PayloadRequest
}): Promise<void> => {
  const now = new Date().toISOString()

  const { docs } = await req.payload.db.find<UploadSessionDoc>({
    collection: slug,
    limit,
    pagination: false,
    req,
    where: {
      or: [
        {
          and: [{ status: { in: ['pending', 'active'] } }, { expiresAt: { less_than: now } }],
        },
        {
          // Failed sessions may hold provider state, e.g. a multipart upload whose size did not match.
          and: [
            { status: { in: ['cancelled', 'failed'] } },
            { cleanupCompletedAt: { exists: false } },
          ],
        },
      ],
    },
  })

  for (const doc of docs) {
    try {
      let session = await reconcileClaimedObject({ req, session: doc })

      if (session.status === 'completed') {
        continue
      }

      if (session.status === 'pending' || session.status === 'active') {
        session = await updateSession({
          data: { cancelledAt: now, cancelReason: 'expired', intent: null, status: 'cancelled' },
          req,
          session,
        })
      }

      await cleanupSessionStorage({ req, session })
    } catch (err) {
      req.payload.logger.error({ err, msg: `Failed to clean up upload session ${doc.id}` })
    }
  }
}

const getOwner = (req: PayloadRequest) => {
  if (!req.user) {
    throw new Forbidden(req.t)
  }

  return { ownerCollection: req.user.collection, ownerID: String(req.user.id) }
}

const ownerWhere = ({
  ownerCollection,
  ownerID,
}: {
  ownerCollection: string
  ownerID: string
}): Where => ({
  and: [{ ownerCollection: { equals: ownerCollection } }, { ownerID: { equals: ownerID } }],
})

const getSegmentedCollection = ({
  collectionSlug,
  req,
}: {
  collectionSlug: string
  req: PayloadRequest
}) => {
  const collection = req.payload.collections[collectionSlug]
  const segmented = collection?.config.upload?.uploadInstructions?.segmented

  if (!collection?.config.upload || !segmented) {
    throw new APIError(`Collection ${collectionSlug} does not support upload sessions.`, 400)
  }

  return {
    collection: collection as {
      config: { upload: NonNullable<typeof collection.config.upload> }
    } & typeof collection,
    segmented,
  }
}

/**
 * Re-runs collection access on every session action because permissions can change during a
 * multi-day transfer. Replacement also requires the target document to pass update access.
 */
const assertTargetAccess = async ({
  collectionSlug,
  operation,
  req,
  targetID,
}: {
  collectionSlug: string
  operation: UploadSessionOperation
  req: PayloadRequest
  targetID?: string
}): Promise<void> => {
  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig) {
    throw new Forbidden(req.t)
  }

  if (operation === 'create') {
    await executeAccess({ slug: collectionSlug, req }, collectionConfig.access.create)
    return
  }

  const accessResult = await executeAccess(
    { id: targetID, slug: collectionSlug, req },
    collectionConfig.access.update,
  )

  const target = await req.payload.db.findOne({
    collection: collectionSlug,
    req,
    where: combineQueries({ id: { equals: targetID } }, accessResult),
  })

  if (!target) {
    throw new Forbidden(req.t)
  }
}

/** Re-runs collection and adapter access for an existing session. */
const assertSessionAccess = async ({
  req,
  session,
}: {
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<void> => {
  await assertTargetAccess({ ...session, req, targetID: session.targetID ?? undefined })

  const { segmented } = getSegmentedCollection({ collectionSlug: session.collectionSlug, req })

  await segmented.authorize?.({ collectionSlug: session.collectionSlug, req })
}

/**
 * Adapters signal failures a retry cannot fix with a 4xx `APIError`. Timeouts and throttling
 * are temporary even though they use 4xx codes.
 */
const isPermanentError = (err: unknown): boolean =>
  err instanceof APIError &&
  err.status >= 400 &&
  err.status < 500 &&
  ![408, 429].includes(err.status)

/** Sessions belonging to someone else are reported as missing so their existence is not revealed. */
const findOwnedSession = async ({
  id,
  req,
}: {
  id: string
  req: PayloadRequest
}): Promise<UploadSessionDoc> => {
  const session = await req.payload.db.findOne<UploadSessionDoc>({
    collection: slug,
    req,
    where: { and: [{ id: { equals: id } }, ownerWhere(getOwner(req))] },
  })

  if (!session) {
    throw new NotFound(req.t)
  }

  return session
}

const assertResumable = ({ session }: { session: UploadSessionDoc }) => {
  if (session.status !== 'pending' && session.status !== 'active') {
    throw new APIError(`This upload is ${session.status}.`, 409)
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new APIError('This upload has expired.', 410)
  }
}

const getInitiatedStorage = ({ session }: { session: UploadSessionDoc }) => {
  const { object, providerState } = session.storage

  if (!object || !providerState) {
    throw new APIError('Upload storage has not been initiated.', 409)
  }

  return { object, providerState }
}

const ensureInitiated = async ({
  req,
  segmented,
  session,
}: {
  req: PayloadRequest
  segmented: SegmentedUploadCapability
  session: UploadSessionDoc
}): Promise<UploadSessionDoc> => {
  if (session.storage.object) {
    return session
  }

  const { object, providerState } = await segmented.initiate({
    collectionSlug: session.collectionSlug,
    docPrefix: session.storage.docPrefix,
    filename: session.file.filename,
    mimeType: session.file.mimeType,
    req,
  })

  return updateSession({
    data: {
      error: null,
      reservedFilename: path.posix.basename(object.storageFilePath),
      storage: { object, providerState },
    },
    req,
    session,
  })
}

/**
 * Takes an exclusive, time-limited claim on finalization so concurrent or retried completions
 * cannot both commit. An expired claim from a crashed request can be taken over.
 */
const claimFinalization = async ({
  req,
  session,
}: {
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<UploadSessionDoc> => {
  const now = new Date()

  const claimedSession = await req.payload.db.updateOne({
    collection: slug,
    data: {
      finalizingUntil: new Date(now.getTime() + FINALIZE_LEASE_MS).toISOString(),
      lastActivityAt: now.toISOString(),
      status: 'active',
      updatedAt: now.toISOString(),
    },
    options: { atomic: true },
    req,
    where: {
      and: [
        { id: { equals: session.id } },
        { status: { in: ['pending', 'active'] } },
        {
          or: [
            { finalizingUntil: { exists: false } },
            { finalizingUntil: { equals: null } },
            { finalizingUntil: { less_than: now.toISOString() } },
          ],
        },
      ],
    },
  })

  if (!claimedSession) {
    throw new APIError('This upload is already being completed.', 409)
  }

  return claimedSession as UploadSessionDoc
}

/** Commits the provider upload after confirming every frozen segment has its exact size. */
const commitStorage = async ({
  req,
  session,
}: {
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<UploadSessionDoc> => {
  if (session.storageCompletedAt) {
    return session
  }

  const { segmented } = getSegmentedCollection({ collectionSlug: session.collectionSlug, req })
  const initiatedSession = await ensureInitiated({ req, segmented, session })
  const { object, providerState } = getInitiatedStorage({ session: initiatedSession })

  const reconciled = await segmented.reconcile({ object, providerState, req })
  const missingSegments = getMissingSegments({
    reconciled,
    segments: initiatedSession.transfer.segments,
  })

  if (missingSegments.length) {
    throw new APIError(
      `Upload is incomplete: ${missingSegments.length} of ${initiatedSession.transfer.segments.length} segments are missing.`,
      409,
    )
  }

  const { size } = await segmented.complete({
    object,
    providerState,
    req,
    segments: reconciled,
  })

  if (size !== initiatedSession.file.size) {
    await updateSession({
      data: {
        error: toSessionError({
          err: new Error('Stored object size does not match the declared file size.'),
          retryable: false,
          source: 'provider',
        }),
        status: 'failed',
      },
      req,
      session: initiatedSession,
    })
    throw new APIError('Stored object size does not match the declared file size.', 400)
  }

  return updateSession({
    data: { storageCompletedAt: new Date().toISOString() },
    req,
    session: initiatedSession,
  })
}

/**
 * The session record is the durable authority for the reserved object, so a fresh receipt is
 * minted whenever a file reference is needed instead of relying on a short-lived browser copy.
 */
const createFileReference = ({
  req,
  session,
}: {
  req: PayloadRequest
  session: UploadSessionDoc
}): UploadInstructions['file'] => {
  const { object } = getInitiatedStorage({ session })

  return {
    filename: object.filename,
    mimeType: session.file.mimeType,
    size: session.file.size,
    uploadReference: {
      _objectKey: object._objectKey,
      prefix: object.prefix,
      signedReceipt: createClientUploadReceipt({
        _objectKey: object._objectKey,
        collectionSlug: session.collectionSlug,
        filename: object.filename,
        filePrefix: object.prefix,
        req,
        storageFilePath: object.storageFilePath,
      }),
    },
  }
}

/** `_objectKey` is unique per session and persisted on the document, so it identifies the claim. */
const findDocumentByObjectKey = async ({
  req,
  session,
}: {
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<{ id: number | string } | null> => {
  if (!session.storage.object) {
    return null
  }

  return req.payload.db.findOne({
    collection: session.collectionSlug,
    req,
    where: { _objectKey: { equals: session.storage.object._objectKey } },
  })
}

/**
 * When storage was completed for a normal form submit, the document request does not know about
 * the session. Detect the claimed object here and mark the session completed.
 */
const reconcileClaimedObject = async ({
  req,
  session,
}: {
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<UploadSessionDoc> => {
  if (
    !session.storageCompletedAt ||
    session.documentID ||
    (session.status !== 'pending' && session.status !== 'active' && session.status !== 'cancelled')
  ) {
    return session
  }

  const claimedDocument = await findDocumentByObjectKey({ req, session })

  return claimedDocument
    ? markCompleted({ documentID: String(claimedDocument.id), req, session })
    : session
}

const findTargetDocument = async ({
  id,
  req,
  session,
}: {
  id: string
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<Record<string, unknown>> =>
  req.payload.findByID({
    id,
    collection: session.collectionSlug,
    overrideAccess: false,
    req,
    user: req.user,
  }) as Promise<Record<string, unknown>>

const markCompleted = ({
  documentID,
  req,
  session,
}: {
  documentID: string
  req: PayloadRequest
  session: UploadSessionDoc
}) =>
  updateSession({
    data: {
      completedAt: new Date().toISOString(),
      documentID,
      error: null,
      finalizingUntil: null,
      intent: null,
      status: 'completed',
    },
    req,
    session,
  })

const cleanupSessionStorage = async ({
  req,
  session,
}: {
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<UploadSessionDoc> => {
  const segmented =
    req.payload.collections[session.collectionSlug]?.config.upload?.uploadInstructions?.segmented

  if (segmented && session.storage.object && session.storage.providerState) {
    await segmented.abort({ ...getInitiatedStorage({ session }), req })
  }

  return updateSession({
    data: { cleanupCompletedAt: new Date().toISOString() },
    req,
    session,
  })
}

const getMissingSegments = ({
  reconciled,
  segments,
}: {
  reconciled: { number: number; size: number }[]
  segments: UploadSegment[]
}): UploadSegment[] => {
  const confirmedSizes = new Map(reconciled.map(({ number, size }) => [number, size]))

  return segments.filter(
    (segment) => confirmedSizes.get(segment.number) !== segment.end - segment.start,
  )
}

const updateSession = async ({
  data,
  req,
  session,
}: {
  data: Record<string, unknown>
  req: PayloadRequest
  session: UploadSessionDoc
}): Promise<UploadSessionDoc> => {
  const updatedSession = await req.payload.db.updateOne({
    id: session.id,
    collection: slug,
    data: { ...data, updatedAt: new Date().toISOString() },
    req,
  })

  return updatedSession as UploadSessionDoc
}

const recordError = ({
  error,
  req,
  session,
}: {
  error: UploadSessionError
  req: PayloadRequest
  session: UploadSessionDoc
}) =>
  updateSession({
    data: { error: { ...error, attempts: (session.error?.attempts ?? 0) + 1 } },
    req,
    session,
  })

/** Keeps only a code and message. Provider URLs, credentials and state never reach the record. */
const toSessionError = ({
  err,
  retryable = true,
  source,
}: {
  err: unknown
  retryable?: boolean
  source: UploadSessionError['source']
}): UploadSessionError => ({
  attempts: 1,
  code: err instanceof Error ? err.name : 'UnknownError',
  message: err instanceof APIError ? err.message : 'The upload could not be completed.',
  occurredAt: new Date().toISOString(),
  retryable,
  source,
})

const toClientSession = ({
  reconciled,
  session,
}: {
  reconciled?: { number: number; size: number }[]
  session: UploadSessionDoc
}): ClientUploadSession => {
  const missingSegmentNumbers = new Set(
    reconciled
      ? getMissingSegments({ reconciled, segments: session.transfer.segments }).map(
          ({ number }) => number,
        )
      : [],
  )
  const completedSegments = reconciled
    ? session.transfer.segments
        .map(({ number }) => number)
        .filter((number) => !missingSegmentNumbers.has(number))
    : []

  return {
    id: session.id,
    cancelReason: session.cancelReason,
    collectionSlug: session.collectionSlug,
    completedSegments,
    documentID: session.documentID,
    error: session.error,
    expiresAt: session.expiresAt,
    file: {
      ...session.file,
      filename: session.storage.object?.filename ?? session.file.filename,
    },
    hasIntent: Boolean(session.intent),
    isStorageComplete: Boolean(session.storageCompletedAt),
    lastActivityAt: session.lastActivityAt,
    operation: session.operation,
    status: session.status,
    targetID: session.targetID,
    transfer: session.transfer,
  }
}
