export const deletionSafetySpy = {
  activeLeaseBranchOnCompletedJobDelete: undefined as string | undefined,
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
  rejectUploadAfterChangeID: undefined as number | string | undefined,
  rejectUploadBeforeDelete: false,
  rejectUploadBeforeValidate: false,
  rejectUploadBeforeValidateID: undefined as number | string | undefined,
  rejectVersionedTargetCreate: false,
  uploadAfterDeleteCount: 0,
  uploadBeforeDeleteCount: 0,
}

export const resetDeletionSafetySpy = (): void => {
  deletionSafetySpy.activeLeaseBranchOnCompletedJobDelete = undefined
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
  deletionSafetySpy.rejectUploadAfterChangeID = undefined
  deletionSafetySpy.rejectUploadBeforeDelete = false
  deletionSafetySpy.rejectUploadBeforeValidate = false
  deletionSafetySpy.rejectUploadBeforeValidateID = undefined
  deletionSafetySpy.rejectVersionedTargetCreate = false
  deletionSafetySpy.uploadAfterDeleteCount = 0
  deletionSafetySpy.uploadBeforeDeleteCount = 0
}
