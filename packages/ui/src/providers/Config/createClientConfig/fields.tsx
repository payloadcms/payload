import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminClient,
  ArrayFieldClient,
  BlockFieldClient,
  ClientBlock,
  ClientField,
  CreateMappedComponent,
  Field,
  ImportMap,
  LabelComponent,
  LabelsClient,
  MappedComponent,
  Payload,
  RadioFieldClient,
  RichTextFieldClient,
  RichTextGenerateComponentMap,
  RowFieldClient,
  RowLabelComponent,
  SelectFieldClient,
  ServerOnlyFieldAdminProperties,
  ServerOnlyFieldProperties,
  TabsFieldClient,
} from 'payload'

import { MissingEditorProp } from 'payload'
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/shared'

import { getComponent } from './getComponent.js'

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
  clientField,
  createMappedComponent,
  field: incomingField,
  i18n,
  importMap,
  parentPath,
  payload,
}: {
  clientField: ClientField
  createMappedComponent: CreateMappedComponent
  field: Field
  i18n: I18nClient
  importMap: ImportMap
  parentPath?: string
  payload: Payload
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

  const CustomLabel: LabelComponent | RowLabelComponent =
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Label' in incomingField.admin.components &&
    incomingField.admin.components.Label

  switch (incomingField.type) {
    case 'array':
    case 'group':
    case 'collapsible':
    case 'row': {
      const field = clientField as unknown as RowFieldClient

      field.fields = createClientFields({
        clientFields: field.fields,
        createMappedComponent,
        disableAddingID: incomingField.type !== 'array',
        fields: incomingField.fields,
        i18n,
        importMap,
        parentPath: field._schemaPath,
        payload,
      })

      if (incomingField?.admin?.components && 'RowLabel' in incomingField.admin.components) {
        ;(field as unknown as ArrayFieldClient).admin.components.RowLabel = createMappedComponent(
          incomingField.admin.components.RowLabel,
          undefined,
          undefined,
          'incomingField.admin.components.RowLabel',
        )
      }

      break
    }

    case 'blocks': {
      const field = clientField as unknown as BlockFieldClient

      if (incomingField.blocks?.length) {
        for (let i = 0; i < incomingField.blocks.length; i++) {
          const block = incomingField.blocks[i]
          const clientBlock: ClientBlock = {
            slug: block.slug,
            admin: {
              components: {},
              custom: block.admin?.custom,
            },
            fields: field.blocks[i].fields,
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

          if (block.admin?.components?.Label) {
            clientBlock.admin.components.Label = createMappedComponent(
              block.admin.components.Label,
              undefined,
              undefined,
              'block.admin.components.Label',
            )
          }

          clientBlock.fields = createClientFields({
            clientFields: clientBlock.fields,
            createMappedComponent,
            fields: block.fields,
            i18n,
            importMap,
            parentPath: `${field._schemaPath}.${block.slug}`,
            payload,
          })

          field.blocks[i] = clientBlock
        }
      }

      break
    }

    case 'richText': {
      const field = clientField as RichTextFieldClient

      if (!incomingField?.editor) {
        throw new MissingEditorProp(incomingField) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
      }
      if (typeof incomingField?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }
      if (!field.admin) {
        field.admin = {}
      }
      if (!field.admin.components) {
        field.admin.components = {}
      }

      field.admin.components.Field = createMappedComponent(
        incomingField.editor.FieldComponent,
        undefined,
        undefined,
        'incomingField.editor.FieldComponent',
      )
      field.admin.components.Cell = createMappedComponent(
        incomingField.editor.CellComponent,
        undefined,
        undefined,
        'incomingField.editor.CellComponent',
      )

      if (incomingField.editor.generateComponentMap) {
        const { Component: generateComponentMap, serverProps } = getComponent({
          identifier: 'richText-generateComponentMap',
          importMap,
          payloadComponent: incomingField.editor.generateComponentMap,
          silent: true,
        })

        if (generateComponentMap) {
          const actualGenerateComponentMap: RichTextGenerateComponentMap = (
            generateComponentMap as any
          )(serverProps)

          const result = actualGenerateComponentMap({
            clientField: field,
            createMappedComponent,
            field: incomingField,
            i18n,
            importMap,
            payload,
            schemaPath: field._schemaPath,
          })

          field.richTextComponentMap = result
        }
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
            createMappedComponent,
            disableAddingID: true,
            fields: tab.fields,
            i18n,
            importMap,
            parentPath: field._schemaPath,
            payload,
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
    clientField.admin = {}
  }

  if (!clientField.admin.components) {
    clientField.admin.components = {}
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

  if (incomingField?.admin?.components?.Cell !== undefined) {
    clientField.admin.components.Cell = createMappedComponent(
      incomingField.admin.components.Cell,
      undefined,
      undefined,
      'incomingField.admin.components.Cell',
    )
  }

  type FieldWithDescriptionComponent = {
    admin: AdminClient
  } & ClientField

  if (
    incomingField?.admin?.components &&
    'Description' in incomingField.admin.components &&
    incomingField?.admin?.components?.Description !== undefined
  ) {
    ;(clientField as FieldWithDescriptionComponent).admin.components.Description =
      createMappedComponent(
        incomingField.admin.components.Description,
        undefined,
        undefined,
        'incomingField.admin.components.Description',
      )
  }

  type FieldWithErrorComponent = {
    admin: {
      components: {
        Error: MappedComponent
      }
    } & AdminClient
  } & ClientField
  if (
    incomingField?.admin?.components &&
    'Error' in incomingField.admin.components &&
    incomingField.admin.components.Error !== undefined
  ) {
    ;(clientField as FieldWithErrorComponent).admin.components.Error = createMappedComponent(
      incomingField.admin.components.Error,
      undefined,
      undefined,
      'incomingField.admin.components.Error',
    )
  }

  if (incomingField?.admin?.components?.Field !== undefined) {
    clientField.admin.components.Field = createMappedComponent(
      incomingField.admin.components.Field,
      undefined,
      undefined,
      'incomingField.admin.components.Field',
    )
  }

  if (
    incomingField?.admin?.components &&
    'Filter' in incomingField.admin.components &&
    incomingField.admin.components.Filter !== undefined
  ) {
    clientField.admin.components.Filter = createMappedComponent(
      incomingField.admin.components.Filter,
      undefined,
      undefined,
      'incomingField.admin.components.Filter',
    )
  }

  type FieldWithLabelComponent = {
    admin: {
      components: {
        Label: MappedComponent
      }
    } & AdminClient
  } & ClientField
  if (
    incomingField?.admin?.components &&
    'Label' in incomingField.admin.components &&
    incomingField.admin.components.Label !== undefined
  ) {
    ;(clientField as FieldWithLabelComponent).admin.components.Label = createMappedComponent(
      CustomLabel,
      undefined,
      undefined,
      'incomingField.admin.components.Label',
    )
  }

  type FieldWithBeforeInputComponent = {
    admin: {
      components: {
        beforeInput: MappedComponent[]
      }
    } & AdminClient
  } & ClientField
  if (
    incomingField?.admin?.components &&
    'beforeInput' in incomingField.admin.components &&
    incomingField.admin.components.beforeInput !== undefined
  ) {
    ;(clientField as FieldWithBeforeInputComponent).admin.components.beforeInput =
      createMappedComponent(
        incomingField.admin?.components?.beforeInput,
        undefined,
        undefined,
        'incomingField.admin.components.beforeInput',
      )
  }

  type FieldWithAfterInputComponent = {
    admin: {
      components: {
        afterInput: MappedComponent[]
      }
    } & AdminClient
  } & ClientField
  if (
    incomingField?.admin?.components &&
    'afterInput' in incomingField.admin.components &&
    incomingField.admin.components.afterInput !== undefined
  ) {
    ;(clientField as FieldWithAfterInputComponent).admin.components.afterInput =
      createMappedComponent(
        incomingField.admin?.components?.afterInput,
        undefined,
        undefined,
        'incomingField.admin.components.afterInput',
      )
  }

  return clientField
}

export const createClientFields = ({
  clientFields,
  createMappedComponent,
  disableAddingID,
  fields,
  i18n,
  importMap,
  parentPath,
  payload,
}: {
  clientFields: ClientField[]
  createMappedComponent: CreateMappedComponent
  disableAddingID?: boolean
  fields: Field[]
  i18n: I18nClient
  importMap: ImportMap
  parentPath?: string
  payload: Payload
}): ClientField[] => {
  const newClientFields: ClientField[] = []
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    const newField = createClientField({
      clientField: clientFields[i],
      createMappedComponent,
      field,
      i18n,
      importMap,
      parentPath,
      payload,
    })
    if (newField) {
      newClientFields.push({ ...newField })
    }
  }
  const hasID = newClientFields.findIndex((f) => fieldAffectsData(f) && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    newClientFields.push({
      name: 'id',
      type: payload.db.defaultIDType === 'number' ? 'number' : 'text',
      _schemaPath: generateFieldPath(parentPath, 'id'),
      admin: {
        components: {
          Field: null,
        },
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
