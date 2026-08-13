import type { Block, ClientBlock, ClientField, Field } from 'payload'

/**
 * Whether any field in the tree is localized, including fields nested in arrays, groups, rows,
 * collapsibles, tabs and blocks.
 *
 * A `blocks` field may hold either an inline block or a slug referencing the root block registry.
 * Pass `blocks` (`config.blocks`) so referenced blocks can be resolved - without it, a block
 * reference is skipped and its localized fields go unnoticed.
 */
export const traverseForLocalizedFields = (
  fields: ClientField[] | Field[],
  blocks?: (Block | ClientBlock)[],
): boolean => {
  for (const field of fields) {
    if ('localized' in field && field.localized) {
      return true
    }

    switch (field.type) {
      case 'array':
      case 'collapsible':
      case 'group':
      case 'row':
        if (field.fields && traverseForLocalizedFields(field.fields, blocks)) {
          return true
        }
        break

      case 'blocks':
        if (field.blocks) {
          for (const blockOrSlug of field.blocks) {
            const block =
              typeof blockOrSlug === 'string'
                ? blocks?.find((each) => each.slug === blockOrSlug)
                : blockOrSlug

            if (block?.fields && traverseForLocalizedFields(block.fields, blocks)) {
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
            if ('fields' in tab && tab.fields && traverseForLocalizedFields(tab.fields, blocks)) {
              return true
            }
          }
        }
        break
    }
  }

  return false
}
