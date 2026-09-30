export const mergeSecuritySpy = {
  allowPageCreate: true,
  rejectedPostTitle: undefined as string | undefined,
}

export const resetMergeSecuritySpy = (): void => {
  mergeSecuritySpy.allowPageCreate = true
  mergeSecuritySpy.rejectedPostTitle = undefined
}
