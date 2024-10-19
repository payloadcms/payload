export const generateFieldKey = ({
  schemaIndex,
  schemaPath,
}: {
  schemaIndex: number | string
  schemaPath: string
}) => `${schemaPath}_index-${schemaIndex}`
