import type { Field } from 'payload/types'

export function transformInputFormSchema(formSchema: any, blockFieldWrapperName: string): Field[] {
  const formSchemaCopy = [...formSchema]

  // First, check if it needs wrapping
  const hasBlockFieldWrapper = formSchemaCopy.some(
    (field) => 'name' in field && field.name === blockFieldWrapperName,
  )
  if (hasBlockFieldWrapper) {
    return formSchemaCopy
  }

  // Add a group in the field schema, which represents all values saved in the blockFieldWrapperName
  return [
    ...formSchemaCopy.filter(
      (field) => 'name' in field && ['blockName', 'blockType', 'id'].includes(field.name),
    ),
    {
      name: blockFieldWrapperName,
      admin: {
        hideGutter: true,
      },
      fields: formSchemaCopy.filter(
        (field) => !('name' in field) || !['blockName', 'blockType', 'id'].includes(field.name),
      ),
      label: '',
      type: 'group',
    },
  ]
}
