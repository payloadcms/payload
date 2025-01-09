import type { I18nClient } from '@payloadcms/translations'

import type {
  AdminClient,
  BlockJSX,
  BlocksFieldClient,
  ClientBlock,
  ClientField,
  Field,
  FieldBase,
  JoinFieldClient,
  LabelsClient,
  RadioFieldClient,
  RowFieldClient,
  SelectFieldClient,
  TabsFieldClient,
} from '../../fields/config/types.js'
import type { Payload } from '../../types/index.js'

import { getFromImportMap } from '../../bin/generateImportMap/getFromImportMap.js'
import { MissingEditorProp } from '../../errors/MissingEditorProp.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { flattenTopLevelFields, type ImportMap } from '../../index.js'
import { removeUndefined } from '../../utilities/removeUndefined.js'

// Should not be used - ClientField should be used instead. This is why we don't export ClientField, we don't want people
// to accidentally use it instead of ClientField and get confused

export { ClientField }

export type ServerOnlyFieldProperties =
  | 'dbName' // can be a function
  | 'editor' // This is a `richText` only property
  | 'enumName' // can be a function
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'graphQL'
  | 'label'
  | 'typescriptSchema'
  | 'validate'
  | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks'>

export type ServerOnlyFieldAdminProperties = keyof Pick<
  FieldBase['admin'],
  'components' | 'condition'
>

const serverOnlyFieldProperties: Partial<ServerOnlyFieldProperties>[] = [
  'hooks',
  'access',
  'validate',
  'defaultValue',
  'filterOptions', // This is a `relationship` and `upload` only property
  'editor', // This is a `richText` only property
  'custom',
  'typescriptSchema',
  'dbName', // can be a function
  'enumName', // can be a function
  'graphQL', // client does not need graphQL
  // the following props are handled separately (see below):
  // `label`
  // `fields`
  // `blocks`
  // `tabs`
  // `admin`
]
const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = [
  'condition',
  'components',
]
type FieldWithDescription = {
  admin: AdminClient
} & ClientField

export const createClientField = ({
  defaultIDType,
  field: incomingField,
  i18n,
  importMap,
}: {
  defaultIDType: Payload['config']['db']['defaultIDType']
  field: Field
  i18n: I18nClient
  importMap: ImportMap
}): ClientField => {
  const clientField: ClientField = {} as ClientField

  for (const key in incomingField) {
    if (serverOnlyFieldProperties.includes(key as any)) {
      continue
    }

    switch (key) {
      case 'admin':
        if (!incomingField.admin) {
          break
        }

        clientField.admin = {} as AdminClient

        for (const adminKey in incomingField.admin) {
          if (serverOnlyFieldAdminProperties.includes(adminKey as any)) {
            continue
          }

          switch (adminKey) {
            case 'description':
              if ('description' in incomingField.admin) {
                if (typeof incomingField.admin?.description !== 'function') {
                  ;(clientField as FieldWithDescription).admin.description =
                    incomingField.admin.description
                }
              }

              break

            default:
              clientField.admin[adminKey] = incomingField.admin[adminKey]
          }
        }

        break

      case 'blocks':
      case 'fields':
      case 'tabs':
        // Skip - we handle sub-fields in the switch below
        break

      case 'label':
        //@ts-expect-error - would need to type narrow
        if (typeof incomingField.label === 'function') {
          //@ts-expect-error - would need to type narrow
          clientField.label = incomingField.label({ t: i18n.t })
        } else {
          //@ts-expect-error - would need to type narrow
          clientField.label = incomingField.label
        }

        break

      default:
        clientField[key] = incomingField[key]
    }
  }

  switch (incomingField.type) {
    case 'array':
    case 'collapsible':
    case 'group':
    case 'row': {
      const field = clientField as unknown as RowFieldClient

      if (!field.fields) {
        field.fields = []
      }

      field.fields = createClientFields({
        defaultIDType,
        disableAddingID: incomingField.type !== 'array',
        fields: incomingField.fields,
        i18n,
        importMap,
      })

      break
    }

    case 'blocks': {
      const field = clientField as unknown as BlocksFieldClient

      if (incomingField.blocks?.length) {
        for (let i = 0; i < incomingField.blocks.length; i++) {
          const block = incomingField.blocks[i]

          // prevent $undefined from being passed through the rsc requests
          const clientBlock = removeUndefined<ClientBlock>({
            slug: block.slug,
            fields: field.blocks?.[i]?.fields || [],
            imageAltText: block.imageAltText,
            imageURL: block.imageURL,
          }) satisfies ClientBlock

          if (block.admin?.custom) {
            clientBlock.admin = {
              custom: block.admin.custom,
            }
          }

          if (block?.admin?.jsx) {
            const jsxResolved = getFromImportMap<BlockJSX>({
              importMap,
              PayloadComponent: block.admin.jsx,
              schemaPath: '',
            })
            clientBlock.jsx = jsxResolved
          }

          if (block.labels) {
            clientBlock.labels = {} as unknown as LabelsClient

            if (block.labels.singular) {
              if (typeof block.labels.singular === 'function') {
                clientBlock.labels.singular = block.labels.singular({ t: i18n.t })
              } else {
                clientBlock.labels.singular = block.labels.singular
              }
              if (typeof block.labels.plural === 'function') {
                clientBlock.labels.plural = block.labels.plural({ t: i18n.t })
              } else {
                clientBlock.labels.plural = block.labels.plural
              }
            }
          }

          clientBlock.fields = createClientFields({
            defaultIDType,
            fields: block.fields,
            i18n,
            importMap,
          })

          if (!field.blocks) {
            field.blocks = []
          }

          field.blocks[i] = clientBlock
        }
      }

      break
    }

    case 'join': {
      const field = clientField as JoinFieldClient

      field.targetField = {
        relationTo: field.targetField.relationTo,
      }

      break
    }

    case 'radio':
    // falls through
    case 'select': {
      const field = clientField as RadioFieldClient | SelectFieldClient

      if (incomingField.options?.length) {
        for (let i = 0; i < incomingField.options.length; i++) {
          const option = incomingField.options[i]

          if (typeof option === 'object' && typeof option.label === 'function') {
            if (!field.options) {
              field.options = []
            }

            field.options[i] = {
              label: option.label({ t: i18n.t }),
              value: option.value,
            }
          }
        }
      }

      break
    }

    case 'richText': {
      if (!incomingField?.editor) {
        throw new MissingEditorProp(incomingField) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
      }

      if (typeof incomingField?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }

      break
    }

    case 'tabs': {
      const field = clientField as unknown as TabsFieldClient

      if (incomingField.tabs?.length) {
        field.tabs = []

        for (let i = 0; i < incomingField.tabs.length; i++) {
          const tab = incomingField.tabs[i]
          const clientTab = {} as unknown as TabsFieldClient['tabs'][0]

          for (const key in tab) {
            if (serverOnlyFieldProperties.includes(key as any)) {
              continue
            }

            const tabProp = tab[key]

            if (key === 'fields') {
              clientTab.fields = createClientFields({
                defaultIDType,
                disableAddingID: true,
                fields: tab.fields,
                i18n,
                importMap,
              })
            } else if (
              (key === 'label' || key === 'description') &&
              typeof tabProp === 'function'
            ) {
              clientTab[key] = tabProp({ t: i18n.t })
            } else {
              clientTab[key] = tabProp
            }
          }
          field.tabs[i] = clientTab
        }
      }

      break
    }

    default:
      break
  }

  return clientField
}

export const createClientFields = ({
  defaultIDType,
  disableAddingID,
  fields,
  i18n,
  importMap,
}: {
  defaultIDType: Payload['config']['db']['defaultIDType']
  disableAddingID?: boolean
  fields: Field[]
  i18n: I18nClient
  importMap: ImportMap
}): ClientField[] => {
  const clientFields: ClientField[] = []

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    const clientField = createClientField({
      defaultIDType,
      field,
      i18n,
      importMap,
    })

    clientFields.push(clientField)
  }

  const hasID = flattenTopLevelFields(fields).some((f) => fieldAffectsData(f) && f.name === 'id')

  if (!disableAddingID && !hasID) {
    clientFields.push({
      name: 'id',
      type: defaultIDType,
      admin: {
        description: 'The unique identifier for this document',
        disableBulkEdit: true,
        disabled: true,
        hidden: true,
      },
      hidden: true,
      label: 'ID',
    })
  }

  return clientFields
}
