export const getFilesFromClipboard = async (): Promise<FileList | null> => {
  if (!navigator.clipboard?.read) {
    return null
  }

  const clipboardItems = await navigator.clipboard.read()
  const dataTransfer = new DataTransfer()

  for (const clipboardItem of clipboardItems) {
    for (const type of clipboardItem.types) {
      if (type.startsWith('text/')) {
        continue
      }

      const blob = await clipboardItem.getType(type)
      const extension = type.split('/')[1] ?? 'bin'
      const filename = `clipboard-${dataTransfer.items.length + 1}.${extension}`

      dataTransfer.items.add(new File([blob], filename, { type }))
    }
  }

  return dataTransfer.files.length > 0 ? dataTransfer.files : null
}
