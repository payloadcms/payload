export const mergeSecuritySpy = {
  allowPageCreate: true,
  cloudUploadContents: [] as string[],
  isUpdatingNestedUpload: false,
  nestedUploadID: undefined as number | string | undefined,
  nestedUploadTriggerAlt: undefined as string | undefined,
  rejectedPostTitle: undefined as string | undefined,
  uploadCleanupRetainedFilename: undefined as string | undefined,
  uploadCleanupSourceFilename: undefined as string | undefined,
  uploadUpdateAccessChecks: 0,
}

export const resetMergeSecuritySpy = (): void => {
  mergeSecuritySpy.allowPageCreate = true
  mergeSecuritySpy.cloudUploadContents.length = 0
  mergeSecuritySpy.isUpdatingNestedUpload = false
  mergeSecuritySpy.nestedUploadID = undefined
  mergeSecuritySpy.nestedUploadTriggerAlt = undefined
  mergeSecuritySpy.rejectedPostTitle = undefined
  mergeSecuritySpy.uploadCleanupRetainedFilename = undefined
  mergeSecuritySpy.uploadCleanupSourceFilename = undefined
  mergeSecuritySpy.uploadUpdateAccessChecks = 0
}
