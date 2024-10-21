export const generateFieldKey = ({
  rowIndex,
  schemaPath,
}: {
  rowIndex: number // 0
  schemaPath: string // array-fields.my-array.text
}) => `${schemaPath}${rowIndex !== undefined ? `_index-${rowIndex}` : ''}`
