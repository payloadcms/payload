import type { I18nClient } from '@payloadcms/translations'

import type {
  AdminClient,
  BlocksFieldClient,
  ClientBlock,
  ClientField,
  Field,
  FieldBase,
  LabelsClient,
  RadioFieldClient,
  RowFieldClient,
  SelectFieldClient,
  TabsFieldClient,
} from '../../fields/config/types.js'
import type { Payload } from '../../types/index.js'

import { MissingEditorProp } from '../../errors/MissingEditorProp.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { flattenTopLevelFields } from '../../index.js'
import { removeUndefined } from '../../utilities/removeUndefined.js'

// Should not be used - ClientField should be used instead. This is why we don't export ClientField, we don't want people
// to accidentally use it instead of ClientField and get confused

export { ClientField }

export type ServerOnlyFieldProperties =
  | 'dbName' // can be a function
  | 'editor' // This is a `richText` only property
  | 'enumName' // can be a function
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'label'
  | 'typescriptSchema'
  | 'validate'
  | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks'>

export type ServerOnlyFieldAdminProperties = keyof Pick<FieldBase['admin'], 'condition'>

export const createClientField = ({
  clientField = {} as ClientField,
  defaultIDType,
  field: incomingField,
  i18n,
}: {
  clientField?: ClientField
  defaultIDType: Payload['config']['db']['defaultIDType']
  field: Field
  i18n: I18nClient
}): ClientField => {
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
    // the following props are handled separately (see below):
    // `label`
    // `fields`
    // `blocks`
    // `tabs`
    // `admin`
  ]

  clientField.admin = clientField.admin || {}
  // clientField.admin.readOnly = true

  serverOnlyFieldProperties.forEach((key) => {
    if (key in clientField) {
      delete clientField[key]
    }
  })

  const isHidden = 'hidden' in incomingField && incomingField?.hidden
  const disabledFromAdmin =
    incomingField?.admin && 'disabled' in incomingField.admin && incomingField.admin.disabled

  if (fieldAffectsData(clientField) && (isHidden || disabledFromAdmin)) {
    return null
  }

  if (
    'label' in clientField &&
    'label' in incomingField &&
    typeof incomingField.label === 'function'
  ) {
    clientField.label = incomingField.label({ t: i18n.t })
  }

  if (!(clientField.admin instanceof Object)) {
    clientField.admin = {} as AdminClient
  }

  if ('admin' in incomingField && 'width' in incomingField.admin) {
    clientField.admin.style = {
      ...clientField.admin.style,
      '--field-width': clientField.admin.width,
    }

    delete clientField.admin.style.width // avoid needlessly adding this to the element's style attribute
  } else {
    if (!(clientField.admin.style instanceof Object)) {
      clientField.admin.style = {}
    }

    clientField.admin.style.flex = '1 1 auto'
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
        clientFields: field.fields,
        defaultIDType,
        disableAddingID: incomingField.type !== 'array',
        fields: incomingField.fields,
        i18n,
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
            clientFields: clientBlock.fields,
            defaultIDType,
            fields: block.fields,
            i18n,
          })

          if (!field.blocks) {
            field.blocks = []
          }

          field.blocks[i] = clientBlock
        }
      }

      break
    }

    case 'radio':

    // eslint-disable-next-line no-fallthrough
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
        for (let i = 0; i < incomingField.tabs.length; i++) {
          const tab = incomingField.tabs[i]
          const clientTab = field.tabs[i]

          serverOnlyFieldProperties.forEach((key) => {
            if (key in clientTab) {
              delete clientTab[key]
            }
          })

          clientTab.fields = createClientFields({
            clientFields: clientTab.fields,
            defaultIDType,
            disableAddingID: true,
            fields: tab.fields,
            i18n,
          })
        }
      }

      break
    }

    default:
      break
  }

  const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = ['condition']

  if (!clientField.admin) {
    clientField.admin = {} as AdminClient
  }

  serverOnlyFieldAdminProperties.forEach((key) => {
    if (key in clientField.admin) {
      delete clientField.admin[key]
    }
  })

  type FieldWithDescription = {
    admin: AdminClient
  } & ClientField

  if (incomingField.admin && 'description' in incomingField.admin) {
    if (
      typeof incomingField.admin?.description === 'string' ||
      typeof incomingField.admin?.description === 'object'
    ) {
      ;(clientField as FieldWithDescription).admin.description = incomingField.admin.description
    } else if (typeof incomingField.admin?.description === 'function') {
      ;(clientField as FieldWithDescription).admin.description = incomingField.admin?.description({
        t: i18n.t,
      })
    }
  }

  return clientField
}

export const createClientFields = ({
  clientFields,
  defaultIDType,
  disableAddingID,
  fields,
  i18n,
}: {
  clientFields: ClientField[]
  defaultIDType: Payload['config']['db']['defaultIDType']
  disableAddingID?: boolean
  fields: Field[]
  i18n: I18nClient
}): ClientField[] => {
  const newClientFields: ClientField[] = []

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    const newField = createClientField({
      clientField: clientFields[i],
      defaultIDType,
      field,
      i18n,
    })

    if (newField) {
      newClientFields.push(newField)
    }
  }

  const hasID = flattenTopLevelFields(fields).some((f) => fieldAffectsData(f) && f.name === 'id')

  if (!disableAddingID && !hasID) {
    newClientFields.push({
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

  return newClientFields
}
