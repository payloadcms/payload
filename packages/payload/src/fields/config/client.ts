import type { I18nClient } from '@payloadcms/translations'

import type { Payload } from '../../types/index.js'

import { MissingEditorProp } from '../../errors/MissingEditorProp.js'
import {
  type AdminClient,
  type BlocksFieldClient,
  type ClientBlock,
  type ClientField,
  type Field,
  fieldAffectsData,
  type FieldBase,
  fieldIsPresentationalOnly,
  type LabelsClient,
  type RadioFieldClient,
  type RowFieldClient,
  type SelectFieldClient,
  type TabsFieldClient,
} from '../../fields/config/types.js'

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

function generateFieldPath(parentPath: string, name: string): string {
  let tabPath = parentPath || ''
  if (parentPath && name) {
    tabPath = `${parentPath}.${name}`
  } else if (!parentPath && name) {
    tabPath = name
  }

  return tabPath
}

export const createClientField = ({
  clientField = {} as ClientField,
  defaultIDType,
  field: incomingField,
  i18n,
  parentPath,
}: {
  clientField: ClientField
  defaultIDType: Payload['config']['db']['defaultIDType']
  field: Field
  i18n: I18nClient
  parentPath?: string
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

  serverOnlyFieldProperties.forEach((key) => {
    if (key in clientField) {
      delete clientField[key]
    }
  })

  if (fieldIsPresentationalOnly(incomingField)) {
    clientField._isPresentational = true
  }

  const isHidden = 'hidden' in incomingField && incomingField?.hidden
  const disabledFromAdmin =
    incomingField?.admin && 'disabled' in incomingField.admin && incomingField.admin.disabled

  if (fieldAffectsData(clientField) && (isHidden || disabledFromAdmin)) {
    return null
  }

  clientField._schemaPath = generateFieldPath(
    parentPath,
    fieldAffectsData(clientField) ? clientField.name : '',
  )

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
      width: undefined, // avoid needlessly adding this to the element's style attribute
    }
  } else {
    if (!(clientField.admin.style instanceof Object)) {
      clientField.admin.style = {}
    }

    clientField.admin.style.flex = '1 1 auto'
  }

  switch (incomingField.type) {
    case 'array':
    case 'group':
    case 'collapsible':
    case 'row': {
      const field = clientField as unknown as RowFieldClient

      field.fields = createClientFields({
        clientFields: field.fields,
        defaultIDType,
        disableAddingID: incomingField.type !== 'array',
        fields: incomingField.fields,
        i18n,
        parentPath: field._schemaPath,
      })

      break
    }

    case 'blocks': {
      const field = clientField as unknown as BlocksFieldClient

      if (incomingField.blocks?.length) {
        for (let i = 0; i < incomingField.blocks.length; i++) {
          const block = incomingField.blocks[i]
          const clientBlock: ClientBlock = {
            slug: block.slug,
            admin: {
              components: {},
              custom: block.admin?.custom,
            },
            fields: field.blocks?.[i]?.fields || [],
            imageAltText: block.imageAltText,
            imageURL: block.imageURL,
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
            parentPath: `${field._schemaPath}.${block.slug}`,
          })

          if (!field.blocks) {
            field.blocks = []
          }

          field.blocks[i] = clientBlock
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
            parentPath: field._schemaPath,
          })
        }
      }

      break
    }

    case 'select':
    case 'radio': {
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

    default:
      break
  }

  const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = ['condition']

  if (!clientField.admin) {
    clientField.admin = {} as AdminClient
  }

  clientField.admin.components = null

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
  parentPath,
}: {
  clientFields: ClientField[]
  defaultIDType: Payload['config']['db']['defaultIDType']
  disableAddingID?: boolean
  fields: Field[]
  i18n: I18nClient
  parentPath?: string
}): ClientField[] => {
  const newClientFields: ClientField[] = []
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    const newField = createClientField({
      clientField: clientFields[i],
      defaultIDType,
      field,
      i18n,
      parentPath,
    })

    if (newField) {
      newClientFields.push(newField)
    }
  }

  const hasID = newClientFields.findIndex((f) => fieldAffectsData(f) && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    newClientFields.push({
      name: 'id',
      type: defaultIDType,
      _schemaPath: generateFieldPath(parentPath, 'id'),
      admin: {
        components: null,
        description: 'The unique identifier for this document',
        disableBulkEdit: true,
        hidden: true,
      },
      hidden: true,
      label: 'ID',
      localized: undefined,
    })
  }
  return newClientFields
}
