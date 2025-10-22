import type { ClientConfig } from '../config/client.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Block, ClientBlock, ClientField, Field } from '../fields/config/types.js'

export const traverseForLocalizedFields = ({
  config,
  fields,
}: {
  config: ClientConfig | SanitizedConfig
  fields: (ClientField | Field)[]
}): boolean => {
  for (const field of fields) {
    if ('localized' in field && field.localized) {
      return true
    }

    switch (field.type) {
      case 'array':
      case 'collapsible':
      case 'group':
      case 'row':
        if (field.fields && traverseForLocalizedFields({ config, fields: field.fields })) {
          return true
        }
        break

      case 'blocks':
        if ('blockReferences' in field && field.blockReferences) {
          for (const blockReference of field.blockReferences) {
            let block: Block | ClientBlock | null = null
            if (typeof blockReference === 'string') {
              block = config.blocks?.find((each) => each.slug === blockReference) ?? null
            } else {
              block = blockReference
            }

            if (block && traverseForLocalizedFields({ config, fields: block.fields })) {
              return true
            }
          }
        }

        if (field.blocks) {
          for (const block of field.blocks) {
            if (block.fields && traverseForLocalizedFields({ config, fields: block.fields })) {
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
              traverseForLocalizedFields({ config, fields: tab.fields })
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
