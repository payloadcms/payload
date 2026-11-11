import type { PayloadRequest } from 'payload'

export const deletionSafetySpy = {
  activeLeaseBranchOnCompletedJobDelete: undefined as string | undefined,
  afterTargetDelete: undefined as
    | ((args: { doc: Record<string, unknown> }) => Promise<void> | void)
    | undefined,
  beforeRejectedUploadAfterChange: undefined as (() => Promise<void>) | undefined,
  beforeTargetDelete: undefined as
    | ((args: { id: number | string; req: PayloadRequest }) => Promise<void>)
    | undefined,
  beforeUploadDelete: undefined as
    | ((args: { id: number | string; req: PayloadRequest }) => Promise<void>)
    | undefined,
  bulkDeleteHookIDs: [] as (number | string)[],
  createUploadOwnerOnBeforeDelete: false,
  createUploadOwnerOnSecondBeforeDelete: false,
  directDatabaseUploadHookWrite: false,
  directDatabaseWriteFailureID: undefined as number | string | undefined,
  directDatabaseWriteTargetID: undefined as number | string | undefined,
  disableUploadHookWriteTransaction: false,
  globalBeforeReadCount: 0,
  hasCreatedRaceJob: false,
  hasCreatedUploadOwner: false,
  mainContentVisibleDuringRejectedCreate: undefined as boolean | undefined,
  mainMergeCollectionDependencyTargetID: undefined as number | string | undefined,
  mainMergeGlobalDependencyTargetID: undefined as number | string | undefined,
  ownerBeforeReadCount: 0,
  queueJobBeforeTargetValidationFailureID: undefined as number | string | undefined,
  reassignGlobalLockDuringValidation: undefined as
    | { lockID: number | string; useCurrentRequest?: boolean; userID: number | string }
    | undefined,
  reassignUploadLockDuringValidation: undefined as
    | { lockID: number | string; useCurrentRequest?: boolean; userID: number | string }
    | undefined,
  rejectTargetAfterChangeID: undefined as number | string | undefined,
  rejectTargetAfterDeleteID: undefined as number | string | undefined,
  rejectUploadAfterChange: false,
  rejectUploadAfterChangeID: undefined as number | string | undefined,
  rejectUploadAfterHookWriteID: undefined as number | string | undefined,
  rejectUploadBeforeDelete: false,
  rejectUploadBeforeValidate: false,
  rejectUploadBeforeValidateID: undefined as number | string | undefined,
  rejectVersionedTargetAfterDeleteID: undefined as number | string | undefined,
  rejectVersionedTargetCreate: false,
  uploadAfterDeleteCount: 0,
  uploadBeforeDeleteCount: 0,
  uploadHookWriteID: undefined as number | string | undefined,
  uploadHookWriteTargetID: undefined as number | string | undefined,
  uploadUpdateRequestFiles: [] as Array<{ id: number | string; name: string | undefined }>,
}
