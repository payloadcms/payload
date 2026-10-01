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
  bulkDeleteHookIDs: [] as (number | string)[],
  createUploadOwnerOnBeforeDelete: false,
  createUploadOwnerOnSecondBeforeDelete: false,
  globalBeforeReadCount: 0,
  hasCreatedRaceJob: false,
  hasCreatedUploadOwner: false,
  mainContentVisibleDuringRejectedCreate: undefined as boolean | undefined,
  mainMergeCollectionDependencyTargetID: undefined as number | string | undefined,
  mainMergeGlobalDependencyTargetID: undefined as number | string | undefined,
  ownerBeforeReadCount: 0,
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
  uploadHookWriteTargetID: undefined as number | string | undefined,
  uploadUpdateRequestFiles: [] as Array<{ id: number | string; name: string | undefined }>,
}

export const resetDeletionSafetySpy = (): void => {
  deletionSafetySpy.activeLeaseBranchOnCompletedJobDelete = undefined
  deletionSafetySpy.afterTargetDelete = undefined
  deletionSafetySpy.beforeRejectedUploadAfterChange = undefined
  deletionSafetySpy.beforeTargetDelete = undefined
  deletionSafetySpy.bulkDeleteHookIDs = []
  deletionSafetySpy.createUploadOwnerOnBeforeDelete = false
  deletionSafetySpy.createUploadOwnerOnSecondBeforeDelete = false
  deletionSafetySpy.globalBeforeReadCount = 0
  deletionSafetySpy.hasCreatedRaceJob = false
  deletionSafetySpy.hasCreatedUploadOwner = false
  deletionSafetySpy.mainContentVisibleDuringRejectedCreate = undefined
  deletionSafetySpy.mainMergeCollectionDependencyTargetID = undefined
  deletionSafetySpy.mainMergeGlobalDependencyTargetID = undefined
  deletionSafetySpy.ownerBeforeReadCount = 0
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
  deletionSafetySpy.uploadHookWriteTargetID = undefined
  deletionSafetySpy.uploadUpdateRequestFiles = []
}
