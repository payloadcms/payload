/** File contents can be protected during drag-enter; browsers may expose only types or items. */
export function hasDraggedFiles({
  dataTransfer,
}: {
  dataTransfer: {
    files?: Pick<FileList, 'length'>
    items?: ArrayLike<Pick<DataTransferItem, 'kind'>>
    types?: ArrayLike<string>
  } | null
}): boolean {
  return Boolean(
    dataTransfer?.files?.length ||
    Array.from(dataTransfer?.items ?? []).some(({ kind }) => kind === 'file') ||
    Array.from(dataTransfer?.types ?? []).some((type) =>
      ['application/x-moz-file', 'files'].includes(type.toLowerCase()),
    ),
  )
}
