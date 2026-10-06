export type ClipboardPasteResult = { files: FileList; type: 'file' } | { type: 'url'; url: string }

const readClipboard = async (): Promise<ClipboardPasteResult | null> => {
  if (!navigator.clipboard?.read) {
    return null
  }

  const clipboardItems = await navigator.clipboard.read()
  const dataTransfer = new DataTransfer()
  // Real OS-level copies (address bar, "copy link", browser context menus) often expose the
  // same URL under several text representations (text/plain, text/uri-list, text/html) rather
  // than a single clean 'text/plain' entry, so every text/* type is a candidate.
  const textCandidates: string[] = []

  for (const clipboardItem of clipboardItems) {
    for (const type of clipboardItem.types) {
      if (type.startsWith('text/')) {
        const textBlob = await clipboardItem.getType(type)
        const text = (await textBlob.text()).trim()
        if (text) {
          textCandidates.push(text)
        }
        continue
      }

      const blob = await clipboardItem.getType(type)
      const extension = type.split('/')[1] ?? 'bin'
      const filename = `clipboard-${dataTransfer.items.length + 1}.${extension}`

      dataTransfer.items.add(new File([blob], filename, { type }))
    }
  }

  if (dataTransfer.files.length > 0) {
    return { type: 'file', files: dataTransfer.files }
  }

  const urlCandidate = textCandidates.find((text) => URL.canParse(text))
  if (urlCandidate) {
    return { type: 'url', url: urlCandidate }
  }

  return null
}

export const getFilesFromClipboard = async (): Promise<FileList | null> => {
  const result = await readClipboard()
  return result?.type === 'file' ? result.files : null
}

export const getFileOrUrlFromClipboard = async (): Promise<ClipboardPasteResult | null> =>
  readClipboard()
