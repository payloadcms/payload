// A transformed original can share the main file's name in its own storage folder. These two
// rules decide which file a shared name means, so the URL and the served file must agree.

type SharedFilenameDoc = {
  _objectKey?: null | string
  filename?: null | string
  original?: { _objectKey?: null | string; filename?: null | string } | null
}

/** A shared filename serves the main file unless the request asks for the original. */
export const isOriginalFileRequest = ({
  doc,
  filename,
  isOriginal,
}: {
  doc: SharedFilenameDoc
  filename: string
  isOriginal?: boolean
}): boolean =>
  doc.original?.filename === filename && (Boolean(isOriginal) || doc.filename !== filename)

/** The original's URL asks for the original when it is a separate object with the main file's name. */
export const shouldRequestOriginal = ({ doc }: { doc?: SharedFilenameDoc }): boolean => {
  const original = doc?.original

  return Boolean(
    original?.filename &&
    original.filename === doc?.filename &&
    (original._objectKey ?? null) !== (doc?._objectKey ?? null),
  )
}
