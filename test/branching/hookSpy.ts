import type { BranchMergeValidate, PayloadRequest } from 'payload'

/**
 * Mutable hook sink, so tests can observe which document hooks merge fires
 * without rebuilding the config.
 */
export const hookSpy: {
  afterChange?: (args: any) => void
  allowRestrictedCreate?: boolean
  allowRestrictedLocalizedCreate?: boolean
  allowRestrictedNestedFieldWrite?: boolean
  beforeChange?: (args: any) => Promise<void> | void
  beforeMerge?: (args: any) => Promise<void> | void
  branchValidation?: BranchMergeValidate
  headerBeforeOperation?: () => void
  homepageGlobalAccessWrites?: {
    heroTitle?: unknown
    locale?: string
    localizedTitle?: unknown
  }[]
  localizedChangeOperations?: string[]
  localizedChangeRows?: { ids: (number | string | undefined)[]; locale?: string }[]
  localizedCreateAccessTitles?: unknown[]
  mainMergeGlobalOriginalHeroTitles?: unknown[]
  mainMergeLocalizedCollectionDependencyTargetID?: number | string
  mainMergeLocalizedGlobalDependencyTargetID?: number | string
  pageBeforeChange?: () => void
  pageBeforeOperation?: (args: { req: PayloadRequest }) => Promise<void> | void
  pageUpdateAccess?: () => void
  postAfterDelete?: (args: any) => Promise<void> | void
  postBeforeOperation?: (args: {
    args: { data?: Record<string, unknown>; id?: number | string }
    req: PayloadRequest
  }) => Promise<void> | void
  postBeforeRead?: () => void
  postDefaultValueCount?: number
  postTitleAfterReadCount?: number
  restrictedCreateAccessResults?: boolean[]
  restrictLedgerSnapshotEntityRead?: boolean
  restrictLedgerSnapshotGlobalRead?: boolean
  restrictLocalizedReadSelect?: boolean
} = {}
