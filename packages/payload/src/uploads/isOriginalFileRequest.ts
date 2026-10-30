/**
 * A transformed original can share the main file's name in its own storage folder. A shared
 * filename serves the main file unless the request asks for the original.
 */
export const isOriginalFileRequest = ({
  doc,
  filename,
  isOriginal,
}: {
  doc: { filename?: null | string; original?: { filename?: null | string } | null }
  filename: string
  isOriginal?: boolean
}): boolean =>
  doc.original?.filename === filename && (Boolean(isOriginal) || doc.filename !== filename)
