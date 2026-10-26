import type { PayloadRequest } from '../../types/index.js'

export type UploadSessionStatus = 'active' | 'cancelled' | 'completed' | 'failed' | 'pending'

export type UploadSessionOperation = 'create' | 'update'

export type UploadSessionCancelReason = 'expired' | 'user'

/** Provider limits a segmented upload must respect. Provider limits always win over preferences. */
export type SegmentedUploadLimits = {
  /** Ordered protocols (e.g. GCS resumable) only accept the next byte range, so concurrency is 1. */
  isOrdered?: boolean
  maximumConcurrency: number
  maximumObjectSize: number
  maximumSegmentCount: number
  maximumSegmentSize: number
  minimumSegmentSize: number
  recommendedSegmentSize?: number
  /** Segments must be sized in multiples of this many bytes (the final segment is exempt). */
  segmentSizeGranularity: number
}

export type UploadSegment = {
  /** Exclusive end byte offset. */
  end: number
  /** 1-based, matching S3 part numbers. */
  number: number
  start: number
}

export type UploadSegmentRequest = {
  headers?: Record<string, string>
  method: 'POST' | 'PUT'
  number: number
  url: string
}

/** Which bytes the provider has confirmed, keyed by segment number. Always authoritative. */
export type ReconciledSegments = {
  number: number
  size: number
}[]

export type ReservedObject = {
  _objectKey: string
  filename: string
  prefix: string
  storageFilePath: string
}

/**
 * Adapter-owned, server-only state such as a multipart upload ID or resumable session URL.
 * Never returned to the browser and never logged.
 */
export type ProviderState = Record<string, unknown>

/**
 * Optional storage-adapter capability for native multipart or resumable uploads. Every method
 * runs on the server after core has authenticated the request and verified session ownership
 * and collection access.
 */
export type SegmentedUploadCapability = {
  abort: (args: {
    object: ReservedObject
    providerState: ProviderState
    req: PayloadRequest
  }) => Promise<void>
  /**
   * Throws when the adapter refuses client uploads for this request, e.g. its `clientUploads.access`
   * rule. Runs before a session is persisted and again before every later session action.
   */
  authorize?: (args: { collectionSlug: string; req: PayloadRequest }) => Promise<void> | void
  /** Commits the provider upload and returns the committed object size for verification. */
  complete: (args: {
    object: ReservedObject
    providerState: ProviderState
    req: PayloadRequest
    segments: ReconciledSegments
  }) => Promise<{ size: number }>
  getSegmentRequests: (args: {
    collectionSlug: string
    expiresIn: number
    mimeType: string
    object: ReservedObject
    providerState: ProviderState
    req: PayloadRequest
    segments: UploadSegment[]
  }) => Promise<UploadSegmentRequest[]>
  /**
   * Starts the provider upload. Throw an `APIError` with a 4xx status for failures a retry cannot
   * fix; core marks the session `failed` so it stops counting against the user's quota.
   */
  initiate: (args: {
    collectionSlug: string
    docPrefix?: string
    filename: string
    mimeType: string
    req: PayloadRequest
  }) => Promise<{ object: ReservedObject; providerState: ProviderState }>
  limits: SegmentedUploadLimits
  reconcile: (args: {
    object: ReservedObject
    providerState: ProviderState
    req: PayloadRequest
  }) => Promise<ReconciledSegments>
}

export type UploadSessionTransferConfig = {
  concurrency?: number
  multipartThreshold?: number
  preferredSegmentSize?: number
  retries?: number
}

export type UploadSessionsConfig = {
  /** @default 7 days */
  expiresIn?: number
  /** Non-terminal sessions allowed per authenticated user. @default 10 */
  maxActive?: number
}

export type UploadSessionError = {
  attempts: number
  code: string
  message: string
  occurredAt: string
  retryable: boolean
  source: 'adapter' | 'client' | 'payload' | 'provider'
}

/** The shape stored in the internal upload-sessions collection. */
export type UploadSessionDoc = {
  cancelledAt?: null | string
  cancelReason?: null | UploadSessionCancelReason
  cleanupCompletedAt?: null | string
  collectionSlug: string
  completedAt?: null | string
  createdAt: string
  documentID?: null | string
  error?: null | UploadSessionError
  expiresAt: string
  file: {
    filename: string
    lastModified?: number
    mimeType: string
    size: number
  }
  /** Exclusive finalization claim; an expired claim may be taken over. */
  finalizingUntil?: null | string
  id: number | string
  /** Document data the user already submitted, kept so a save survives navigation or a reload. */
  intent?: null | UploadSessionIntent
  lastActivityAt: string
  operation: UploadSessionOperation
  ownerCollection: string
  ownerID: string
  /** Unique; see `getReservationKey`. */
  reservationKey: string
  /** The `-original` filename this session's object key uses, held until the session ends. */
  reservedFilename?: null | string
  status: UploadSessionStatus
  storage: {
    /** Only needed until the provider upload is initiated. */
    docPrefix?: string
    object: null | ReservedObject
    providerState: null | ProviderState
  }
  storageCompletedAt?: null | string
  targetID?: null | string
  transfer: {
    concurrency: number
    segments: UploadSegment[]
    strategy: 'segmented'
  }
  updatedAt: string
}

export type UploadSessionIntent = {
  data: Record<string, unknown>
  draft?: boolean
  submittedAt: string
}

/** The browser-safe projection. Storage state and provider credentials are never included. */
export type ClientUploadSession = {
  completedSegments: number[]
  file: UploadSessionDoc['file']
  /** Whether submitted document data is waiting for the upload to finish. */
  hasIntent: boolean
  isStorageComplete: boolean
} & Pick<
  UploadSessionDoc,
  | 'cancelReason'
  | 'collectionSlug'
  | 'documentID'
  | 'error'
  | 'expiresAt'
  | 'id'
  | 'lastActivityAt'
  | 'operation'
  | 'status'
  | 'targetID'
  | 'transfer'
>
