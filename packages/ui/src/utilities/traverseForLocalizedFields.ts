import type { ClientBlock, ClientField, Field } from 'payload'

type TraverseForLocalizedFieldsArgs = {
  blocksMap?: Record<string, ClientBlock>
  fields: ClientField[] | Field[]
}

export const traverseForLocalizedFields = (
  args: (ClientField | Field)[] | TraverseForLocalizedFieldsArgs,
): boolean => {
  const { blocksMap, fields } = Array.isArray(args) ? { blocksMap: undefined, fields: args } : args

  for (const field of fields) {
    if ('localized' in field && field.localized) {
      return true
    }

    switch (field.type) {
      case 'array':
      case 'collapsible':
      case 'group':
      case 'row':
        if (field.fields && traverseForLocalizedFields({ blocksMap, fields: field.fields })) {
          return true
        }
        break

      case 'blocks':
        if (field.blocks) {
          for (const blockOrSlug of field.blocks) {
            const block = typeof blockOrSlug === 'string' ? blocksMap?.[blockOrSlug] : blockOrSlug

            if (block?.fields && traverseForLocalizedFields({ blocksMap, fields: block.fields })) {
              return true
            }
          }
        }
        break

      case 'tabs':
        if (field.tabs) {
          for (const tab of field.tabs) {
            if ('localized' in tab && tab.localized) {
              return true
            }
            if (
              'fields' in tab &&
              tab.fields &&
              traverseForLocalizedFields({ blocksMap, fields: tab.fields })
            ) {
              return true
            }
          }
        }
        break
    }
  }

  return false
}
