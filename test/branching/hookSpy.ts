import type { PayloadRequest } from 'payload'

/**
 * Mutable hook sink, so tests can observe which document hooks merge fires
 * without rebuilding the config.
 */
export const hookSpy: {
  afterChange?: (args: any) => void
  allowRestrictedCreate?: boolean
  allowRestrictedLocalizedCreate?: boolean
  allowRestrictedNestedFieldWrite?: boolean
  beforeChange?: (args: any) => void
  beforeMerge?: (args: any) => Promise<void> | void
  headerBeforeOperation?: () => void
  homepageGlobalAccessWrites?: {
    heroTitle?: unknown
    locale?: string
    localizedTitle?: unknown
  }[]
  localizedChangeOperations?: string[]
  localizedChangeRows?: { ids: (number | string | undefined)[]; locale?: string }[]
  localizedCreateAccessTitles?: unknown[]
  pageBeforeChange?: () => void
  pageBeforeOperation?: (args: { req: PayloadRequest }) => Promise<void> | void
  pageUpdateAccess?: () => void
  postBeforeOperation?: () => void
  postBeforeRead?: () => void
  postDefaultValueCount?: number
  postTitleAfterReadCount?: number
  restrictedCreateAccessResults?: boolean[]
  restrictLedgerSnapshotEntityRead?: boolean
  restrictLedgerSnapshotGlobalRead?: boolean
  restrictLocalizedReadSelect?: boolean
} = {}
