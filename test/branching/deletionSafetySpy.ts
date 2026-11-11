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

export const resetDeletionSafetySpy = (): void => {
  deletionSafetySpy.activeLeaseBranchOnCompletedJobDelete = undefined
  deletionSafetySpy.afterTargetDelete = undefined
  deletionSafetySpy.beforeRejectedUploadAfterChange = undefined
  deletionSafetySpy.beforeTargetDelete = undefined
  deletionSafetySpy.beforeUploadDelete = undefined
  deletionSafetySpy.bulkDeleteHookIDs = []
  deletionSafetySpy.createUploadOwnerOnBeforeDelete = false
  deletionSafetySpy.createUploadOwnerOnSecondBeforeDelete = false
  deletionSafetySpy.directDatabaseUploadHookWrite = false
  deletionSafetySpy.directDatabaseWriteFailureID = undefined
  deletionSafetySpy.directDatabaseWriteTargetID = undefined
  deletionSafetySpy.disableUploadHookWriteTransaction = false
  deletionSafetySpy.globalBeforeReadCount = 0
  deletionSafetySpy.hasCreatedRaceJob = false
  deletionSafetySpy.hasCreatedUploadOwner = false
  deletionSafetySpy.mainContentVisibleDuringRejectedCreate = undefined
  deletionSafetySpy.mainMergeCollectionDependencyTargetID = undefined
  deletionSafetySpy.mainMergeGlobalDependencyTargetID = undefined
  deletionSafetySpy.ownerBeforeReadCount = 0
  deletionSafetySpy.queueJobBeforeTargetValidationFailureID = undefined
  deletionSafetySpy.reassignGlobalLockDuringValidation = undefined
  deletionSafetySpy.reassignUploadLockDuringValidation = undefined
  deletionSafetySpy.rejectTargetAfterChangeID = undefined
  deletionSafetySpy.rejectTargetAfterDeleteID = undefined
  deletionSafetySpy.rejectUploadAfterChange = false
  deletionSafetySpy.rejectUploadAfterChangeID = undefined
  deletionSafetySpy.rejectUploadAfterHookWriteID = undefined
  deletionSafetySpy.rejectUploadBeforeDelete = false
  deletionSafetySpy.rejectUploadBeforeValidate = false
  deletionSafetySpy.rejectUploadBeforeValidateID = undefined
  deletionSafetySpy.rejectVersionedTargetCreate = false
  deletionSafetySpy.rejectVersionedTargetAfterDeleteID = undefined
  deletionSafetySpy.uploadAfterDeleteCount = 0
  deletionSafetySpy.uploadBeforeDeleteCount = 0
  deletionSafetySpy.uploadHookWriteID = undefined
  deletionSafetySpy.uploadHookWriteTargetID = undefined
  deletionSafetySpy.uploadUpdateRequestFiles = []
}
