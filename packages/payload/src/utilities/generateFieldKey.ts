export const generateFieldKey = ({
  path = '',
  schemaIndex,
}: {
  path: string
  schemaIndex: number | string
}) => `${path}${!path && schemaIndex !== undefined ? `_index-${schemaIndex}` : ''}`
