import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminClient,
  ArrayFieldClient,
  BlocksFieldClient,
  ClientBlock,
  ClientField,
  CreateMappedComponent,
  Field,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
  ImportMap,
  LabelsClient,
  MappedComponent,
  Payload,
  RadioFieldClient,
  RichTextFieldClient,
  RichTextGenerateComponentMap,
  RowFieldClient,
  RowLabelComponent,
  SelectFieldClient,
  ServerFieldBase,
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

  const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = ['condition']

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

  const CustomLabel: FieldLabelClientComponent | FieldLabelServerComponent | RowLabelComponent =
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Label' in incomingField.admin.components &&
    incomingField.admin.components.Label

  const serverProps: {
    serverProps: ServerFieldBase
  } = {
    serverProps: {
      clientField: undefined,
      field: incomingField,
    },
  }

  if ('admin' in incomingField && 'width' in incomingField.admin) {
    clientField.admin.style = {
      ...clientField.admin.style,
      '--field-width': clientField.admin.width,
      width: undefined, // avoid needlessly adding this to the element's style attribute
    }
  } else {
    if (!(clientField.admin instanceof Object)) {
      clientField.admin = {}
    }
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
          serverProps,
          undefined,
          'incomingField.admin.components.RowLabel',
        )
      }

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
              serverProps,
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
      const field = clientField

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
        serverProps,
        undefined,
        'incomingField.editor.FieldComponent',
      )

      field.admin.components.Cell = createMappedComponent(
        incomingField.editor.CellComponent,
        serverProps,
        undefined,
        'incomingField.editor.CellComponent',
      )

      if (incomingField.editor.generateComponentMap) {
        const { Component: generateComponentMap, serverProps: richTextServerProps } = getComponent({
          identifier: 'richText-generateComponentMap',
          importMap,
          payloadComponent: incomingField.editor.generateComponentMap,
          silent: true,
        })

        if (generateComponentMap) {
          const actualGenerateComponentMap: RichTextGenerateComponentMap = (
            generateComponentMap as any
          )(richTextServerProps)

          const result = actualGenerateComponentMap({
            clientField: field as RichTextFieldClient,
            createMappedComponent,
            field: incomingField,
            i18n,
            importMap,
            payload,
            schemaPath: field._schemaPath,
          })

          ;(field as RichTextFieldClient).richTextComponentMap = result
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

          if ('admin' in clientTab) {
            serverOnlyFieldAdminProperties.forEach((key) => {
              if (key in clientTab.admin) {
                delete clientTab.admin[key]
              }
            })
          }

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

    // case 'joins': {
    //
    // }

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

  const fieldServerProps: {
    serverProps: ServerFieldBase
  } = {
    serverProps: {
      clientField,
      field: incomingField,
    },
  }

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
      fieldServerProps,
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
        fieldServerProps,
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
      fieldServerProps,
      undefined,
      'incomingField.admin.components.Error',
    )
  }

  if (incomingField?.admin?.components?.Field !== undefined) {
    clientField.admin.components.Field = createMappedComponent(
      incomingField.admin.components.Field,
      fieldServerProps,
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
      fieldServerProps,
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
      fieldServerProps,
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
        fieldServerProps,
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
        fieldServerProps,
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
      newClientFields.push(newField)
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
