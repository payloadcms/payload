export const buildStoredPathUpdateData = ({
  slugPath,
  slugPathFieldName,
  titlePath,
  titlePathFieldName,
}: {
  slugPath: Record<string, string> | string
  slugPathFieldName: string
  titlePath: Record<string, string> | string
  titlePathFieldName: string
}): Record<string, unknown> => ({
  [slugPathFieldName]: slugPath,
  [titlePathFieldName]: titlePath,
})
