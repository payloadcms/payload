import type {
  ClientCollectionConfig,
  ClientUploadSession,
  UploadInstructions,
  UploadSegmentRequest,
  UploadSessionSaveOptions,
} from 'payload'

import {
  defaultUploadTransferConfig,
  formatAdminURL,
  uploadRequiresServerValidation,
} from 'payload/shared'

const SESSIONS_PATH = '/payload-upload-sessions'
const BASE_RETRY_DELAY_MS = 500
const CANCEL_RETRIES = 4

/** A browser-side upload failure the Admin can describe in the user's language. */
export class UploadSessionClientError extends Error {
  code: 'fileMismatch' | 'storageRejectedSegments'

  constructor({ code }: { code: UploadSessionClientError['code'] }) {
    super(
      code === 'fileMismatch'
        ? 'The selected file does not match the interrupted upload.'
        : 'Storage did not accept any upload segments. Check the bucket CORS policy.',
    )
    this.code = code
    this.name = 'UploadSessionClientError'
  }
}

/** A session API request the server rejected. */
class UploadSessionRequestError extends Error {
  status: number

  constructor({ message, status }: { message: string; status: number }) {
    super(message)
    this.name = 'UploadSessionRequestError'
    this.status = status
  }
}

/** Whether a session request failed because the session no longer exists, not e.g. a network error. */
export const isUploadSessionGoneError = (err: unknown): boolean =>
  err instanceof UploadSessionRequestError && (err.status === 404 || err.status === 410)

export type UploadSessionIntentData = {
  data: Record<string, unknown>
  draft?: boolean
  /** Locale and upload edits of the save, which a normal save sends in its query string. */
  options?: UploadSessionSaveOptions
}

export type UploadSessionProgress = {
  loaded: number
  total: number
}

type SessionRequestArgs = {
  apiRoute: string
  serverURL: string
}

/**
 * Whether a file should use a resumable upload session instead of the single-request client
 * upload. Small files and file types that need server validation keep the existing path.
 */
export const shouldUseUploadSession = ({
  collectionConfig,
  file,
}: {
  collectionConfig: ClientCollectionConfig
  file: File
}): boolean => {
  const upload = collectionConfig.upload

  if (!upload?.uploadInstructions.supportsSegmentedUploads) {
    return false
  }

  const threshold =
    upload.transfer?.multipartThreshold ?? defaultUploadTransferConfig.multipartThreshold

  return (
    file.size >= threshold &&
    !uploadRequiresServerValidation({
      allowRestrictedFileTypes: upload.allowRestrictedFileTypes,
      filename: file.name,
      mimeType: file.type,
    })
  )
}

/**
 * Uploads a file through a durable session and returns the same file reference a single-request
 * client upload returns, so the document is still saved through the normal create or update.
 *
 * Pass `reusableSessionID` from an earlier attempt with the same file, e.g. a save that failed
 * after or during the upload. While that session is still unfinished it is resumed, so a retry
 * sends only missing segments and does not take another session from the user's quota.
 */
export const uploadWithSession = async ({
  apiRoute,
  collectionSlug,
  docPrefix,
  file,
  onProgress,
  onSession,
  retries = defaultUploadTransferConfig.retries,
  reusableSessionID,
  serverURL,
  signal,
  targetID,
}: {
  collectionSlug: string
  docPrefix?: string
  file: File
  onProgress?: (progress: UploadSessionProgress) => void
  /** Called with the session the upload uses, before any bytes are sent. */
  onSession?: (session: ClientUploadSession) => void
  retries?: number
  reusableSessionID?: number | string
  signal?: AbortSignal
  targetID?: number | string
} & SessionRequestArgs): Promise<UploadInstructions['file']> => {
  const reusableSession =
    reusableSessionID === undefined
      ? undefined
      : await getUploadSession({ id: reusableSessionID, apiRoute, serverURL, signal }).catch(
          () => undefined,
        )

  const isReusable =
    reusableSession !== undefined &&
    (reusableSession.status === 'pending' || reusableSession.status === 'active') &&
    reusableSession.collectionSlug === collectionSlug &&
    (reusableSession.targetID ?? undefined) ===
      (targetID === undefined ? undefined : String(targetID))

  const session = isReusable
    ? reusableSession
    : await createUploadSession({
        apiRoute,
        collectionSlug,
        docPrefix,
        file,
        serverURL,
        signal,
        targetID,
      })

  onSession?.(session)

  return resumeUploadSession({ apiRoute, file, onProgress, retries, serverURL, session, signal })
}

/** Starts a session for a file. A `targetID` replaces the file of an existing document. */
export const createUploadSession = ({
  apiRoute,
  collectionSlug,
  docPrefix,
  file,
  serverURL,
  signal,
  targetID,
}: {
  collectionSlug: string
  docPrefix?: string
  file: File
  signal?: AbortSignal
  targetID?: number | string
} & SessionRequestArgs): Promise<ClientUploadSession> =>
  requestSession<ClientUploadSession>({
    apiRoute,
    body: {
      collectionSlug,
      docPrefix,
      file: {
        filename: file.name,
        lastModified: file.lastModified,
        mimeType: file.type,
        size: file.size,
      },
      operation: targetID === undefined ? 'create' : 'update',
      targetID: targetID === undefined ? undefined : String(targetID),
    },
    path: SESSIONS_PATH,
    serverURL,
    signal,
  })

/** Returns the current user's unfinished sessions. */
export const listUploadSessions = async (
  args: SessionRequestArgs,
): Promise<ClientUploadSession[]> => {
  const { docs } = await requestSession<{ docs: ClientUploadSession[] }>({
    ...args,
    method: 'GET',
    path: SESSIONS_PATH,
  })

  return docs
}

/** Keeps document data the user already submitted so the save can finish after navigation or a reload. */
export const setUploadSessionIntent = ({
  id,
  intent,
  ...args
}: {
  id: number | string
  intent: UploadSessionIntentData
} & SessionRequestArgs): Promise<ClientUploadSession> =>
  requestSession({ ...args, body: intent, path: `${SESSIONS_PATH}/${id}/intent` })

/** Drops stored document data, e.g. once the form saves the document itself. */
export const clearUploadSessionIntent = ({
  id,
  ...args
}: { id: number | string } & SessionRequestArgs): Promise<ClientUploadSession> =>
  requestSession({ ...args, method: 'DELETE', path: `${SESSIONS_PATH}/${id}/intent` })

export const getUploadSession = ({
  id,
  ...args
}: {
  id: number | string
  signal?: AbortSignal
} & SessionRequestArgs): Promise<ClientUploadSession> =>
  requestSession({ ...args, method: 'GET', path: `${SESSIONS_PATH}/${id}` })

/** Returns a fresh file reference for a session whose storage is complete. */
export const getUploadSessionFile = async ({
  id,
  ...args
}: { id: number | string } & SessionRequestArgs): Promise<UploadInstructions['file']> => {
  const { file } = await requestSession<{ file: UploadInstructions['file'] }>({
    ...args,
    path: `${SESSIONS_PATH}/${id}/storage`,
  })

  return file
}

/** Creates or updates the document using the stored intent. */
export const completeUploadSession = ({
  id,
  ...args
}: { id: number | string } & SessionRequestArgs): Promise<{
  doc: { id: number | string }
  session: ClientUploadSession
}> => requestSession({ ...args, path: `${SESSIONS_PATH}/${id}/complete` })

/**
 * Continues a session with the original file, sending only the segments storage has not
 * confirmed. After a reload the user must reselect the file, so its identity is checked first.
 */
export const resumeUploadSession = async ({
  apiRoute,
  file,
  onProgress,
  retries = defaultUploadTransferConfig.retries,
  serverURL,
  session,
  signal,
}: {
  file: File
  onProgress?: (progress: UploadSessionProgress) => void
  retries?: number
  session: ClientUploadSession
  signal?: AbortSignal
} & SessionRequestArgs): Promise<UploadInstructions['file']> => {
  if (
    file.size !== session.file.size ||
    file.type !== session.file.mimeType ||
    (session.file.lastModified !== undefined && file.lastModified !== session.file.lastModified)
  ) {
    throw new UploadSessionClientError({ code: 'fileMismatch' })
  }

  const sessionPath = `${SESSIONS_PATH}/${session.id}` as const
  const segments = new Map(session.transfer.segments.map((segment) => [segment.number, segment]))
  let concurrency = session.transfer.concurrency
  let stalledWindows = 0

  while (true) {
    const { requests, session: currentSession } = await requestSession<{
      requests: UploadSegmentRequest[]
      session: ClientUploadSession
    }>({ apiRoute, path: `${sessionPath}/instructions`, serverURL, signal })

    const confirmedBytes = currentSession.completedSegments.reduce((total, number) => {
      const segment = segments.get(number)
      return segment ? total + segment.end - segment.start : total
    }, 0)

    if (!requests.length) {
      onProgress?.({
        loaded: currentSession.isStorageComplete ? file.size : confirmedBytes,
        total: file.size,
      })
      break
    }

    let windowBytes = 0
    const queue = [...requests]

    const sendNext = async (): Promise<void> => {
      const request = queue.shift()

      if (!request) {
        return
      }

      const segment = segments.get(request.number)
      const result = await sendSegment({
        body: file.slice(segment.start, segment.end),
        request,
        retries,
        signal,
      })

      if (result === 'throttled') {
        concurrency = Math.max(1, Math.floor(concurrency / 2))
      }

      if (result === 'sent') {
        windowBytes += segment.end - segment.start
        onProgress?.({ loaded: confirmedBytes + windowBytes, total: file.size })
      }

      // Expired or throttled segments are picked up again by the next instructions request.
      if (result === 'sent') {
        await sendNext()
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, sendNext))

    // A window where nothing was accepted (e.g. a CORS or permission problem) must not loop forever.
    stalledWindows = windowBytes ? 0 : stalledWindows + 1

    if (stalledWindows > retries) {
      throw new UploadSessionClientError({ code: 'storageRejectedSegments' })
    }

    // Throttled segments come back right away, so give storage time to recover first.
    if (stalledWindows) {
      await wait({ ms: getRetryDelay({ attempt: stalledWindows - 1 }), signal })
    }
  }

  const { file: uploadedFile } = await requestSession<{ file: UploadInstructions['file'] }>({
    apiRoute,
    path: `${sessionPath}/storage`,
    serverURL,
    signal,
  })

  return uploadedFile
}

/** Cancels a session and releases its provider storage. */
export const cancelUploadSession = async ({
  id,
  apiRoute,
  serverURL,
}: { id: number | string } & SessionRequestArgs): Promise<ClientUploadSession> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await requestSession<ClientUploadSession>({
        apiRoute,
        method: 'DELETE',
        path: `${SESSIONS_PATH}/${id}`,
        serverURL,
      })
    } catch (err) {
      // 409 while another request starts or finishes storage; the cancel can go ahead after it.
      if (
        attempt >= CANCEL_RETRIES ||
        !(err instanceof UploadSessionRequestError) ||
        err.status !== 409
      ) {
        throw err
      }

      await wait({ ms: getRetryDelay({ attempt }) })
    }
  }
}

/**
 * Sends one segment, retrying transient failures with exponential backoff and jitter. Expired
 * instructions and throttling end the attempt early so the caller can request fresh URLs.
 */
const sendSegment = async ({
  body,
  request,
  retries,
  signal,
}: {
  body: Blob
  request: UploadSegmentRequest
  retries: number
  signal?: AbortSignal
}): Promise<'expired' | 'sent' | 'throttled'> => {
  for (let attempt = 0; ; attempt++) {
    let response: Response | undefined

    try {
      response = await fetch(request.url, {
        body,
        headers: request.headers,
        method: request.method,
        signal,
      })
    } catch (err) {
      // Network failure: retried below.
      if (signal?.aborted || attempt >= retries) {
        throw err
      }
    }

    if (response?.ok) {
      return 'sent'
    }

    if (response?.status === 403) {
      return 'expired'
    }

    if (response?.status === 429 || response?.status === 503) {
      return 'throttled'
    }

    // Any other 4xx means the request itself is wrong, so sending it again cannot help.
    if (response && response.status < 500) {
      throw new Error(`Upload failed with status ${response.status}`)
    }

    if (attempt >= retries) {
      throw new Error('Upload failed after repeated retries.')
    }

    await wait({ ms: getRetryDelay({ attempt }), signal })
  }
}

const requestSession = async <T>({
  apiRoute,
  body,
  method = 'POST',
  path,
  serverURL,
  signal,
}: {
  body?: unknown
  method?: 'DELETE' | 'GET' | 'POST'
  path: `/${string}`
  signal?: AbortSignal
} & SessionRequestArgs): Promise<T> => {
  const response = await fetch(formatAdminURL({ apiRoute, path, serverURL }), {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method,
    signal,
  })

  if (!response.ok) {
    const { errors } = (await response.json().catch(() => ({ errors: [] }))) as {
      errors?: { message: string }[]
    }
    throw new UploadSessionRequestError({
      message:
        errors?.map(({ message }) => message).join(', ') ||
        `Upload session request failed with status ${response.status}`,
      status: response.status,
    })
  }

  return response.json() as Promise<T>
}

const wait = ({ ms, signal }: { ms: number; signal?: AbortSignal }) =>
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(signal.reason instanceof Error ? signal.reason : new Error('Upload aborted.'))
      },
      { once: true },
    )
  })

/** Exponential backoff with jitter. */
const getRetryDelay = ({ attempt }: { attempt: number }) =>
  BASE_RETRY_DELAY_MS * 2 ** attempt * (0.5 + Math.random())
