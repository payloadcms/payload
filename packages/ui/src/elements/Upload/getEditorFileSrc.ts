export const getEditorFileSrc = ({
  data,
  fileSrc,
  hasSelectedFile,
}: {
  data?: { original?: { url?: string } | null; url?: string }
  fileSrc?: null | string
  hasSelectedFile: boolean
}): string => (hasSelectedFile && fileSrc) || data?.original?.url || data?.url || fileSrc || ''
