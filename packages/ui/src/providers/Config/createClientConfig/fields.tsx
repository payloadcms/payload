import type { I18nClient } from '@payloadcms/translations'
import type {
  BlocksFieldClient,
  ClientFieldConfig,
  CreateMappedComponent,
  Field,
  ImportMap,
  LabelComponent,
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
import { fieldAffectsData, fieldIsPresentationalOnly, fieldIsSidebar } from 'payload/shared'

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

export const createClientFieldConfig = ({
  clientField,
  createMappedComponent,
  field: incomingField,
  i18n,
  importMap,
  parentPath,
  payload,
}: {
  clientField: ClientFieldConfig
  createMappedComponent: CreateMappedComponent
  field: Field
  i18n: I18nClient
  importMap: ImportMap
  parentPath?: string
  payload: Payload
}): ClientFieldConfig => {
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

  clientField._fieldIsPresentational = fieldIsPresentationalOnly(incomingField)
  clientField._isFieldAffectingData = fieldAffectsData(incomingField)
  clientField._isSidebar = fieldIsSidebar(incomingField)

  const isHidden = 'hidden' in incomingField && incomingField?.hidden
  const disabledFromAdmin =
    incomingField?.admin && 'disabled' in incomingField.admin && incomingField.admin.disabled

  if (clientField._isFieldAffectingData && (isHidden || disabledFromAdmin)) {
    return null
  }

  clientField._path = generateFieldPath(
    parentPath,
    clientField._isFieldAffectingData && 'name' in clientField ? clientField.name : '',
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

      field.fields = createClientFieldConfigs({
        clientFields: field.fields,
        createMappedComponent,
        disableAddingID: incomingField.type !== 'array',
        fields: incomingField.fields,
        i18n,
        importMap,
        parentPath: field._path,
        payload,
      })

      if (incomingField?.admin?.components && 'RowLabel' in incomingField.admin.components) {
        clientField.admin.components.RowLabel = createMappedComponent(
          incomingField.admin.components.RowLabel,
          undefined,
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
          const clientBlock = field.blocks[i]
          clientBlock.fields = createClientFieldConfigs({
            clientFields: clientBlock.fields,
            createMappedComponent,
            fields: block.fields,
            i18n,
            importMap,
            parentPath: field._path,
            payload,
          })
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
        })

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

          clientTab.fields = createClientFieldConfigs({
            clientFields: clientTab.fields,
            createMappedComponent,
            disableAddingID: true,
            fields: tab.fields,
            i18n,
            importMap,
            parentPath: field._path,
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

  if (incomingField.admin && 'description' in incomingField.admin) {
    if (
      typeof incomingField.admin?.description === 'string' ||
      typeof incomingField.admin?.description === 'object'
    ) {
      clientField.admin.description = incomingField.admin.description
    } else if (typeof incomingField.admin?.description === 'function') {
      clientField.admin.description = incomingField.admin?.description({ t: i18n.t })
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

  if (
    incomingField?.admin?.components &&
    'Description' in incomingField.admin.components &&
    incomingField?.admin?.components?.Description !== undefined
  ) {
    clientField.admin.components.Description = createMappedComponent(
      incomingField.admin.components.Description,
      undefined,
      undefined,
      'incomingField.admin.components.Description',
    )
  }

  if (
    incomingField?.admin?.components &&
    'Error' in incomingField.admin.components &&
    incomingField.admin.components.Error !== undefined
  ) {
    clientField.admin.components.Error = createMappedComponent(
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

  if (
    incomingField?.admin?.components &&
    'Label' in incomingField.admin.components &&
    incomingField.admin.components.Label !== undefined
  ) {
    clientField.admin.components.Label = createMappedComponent(
      CustomLabel,
      undefined,
      undefined,
      'incomingField.admin.components.Label',
    )
  }

  if (
    incomingField?.admin?.components &&
    'beforeInput' in incomingField.admin.components &&
    incomingField.admin.components.beforeInput !== undefined
  ) {
    clientField.admin.components.beforeInput = createMappedComponent(
      incomingField.admin?.components?.beforeInput,
      undefined,
      undefined,
      'incomingField.admin.components.beforeInput',
    )
  }

  if (
    incomingField?.admin?.components &&
    'afterInput' in incomingField.admin.components &&
    incomingField.admin.components.afterInput !== undefined
  ) {
    clientField.admin.components.afterInput = createMappedComponent(
      incomingField.admin?.components?.afterInput,
      undefined,
      undefined,
      'incomingField.admin.components.afterInput',
    )
  }

  return clientField
}

export const createClientFieldConfigs = ({
  clientFields,
  createMappedComponent,
  disableAddingID,
  fields,
  i18n,
  importMap,
  parentPath,
  payload,
}: {
  clientFields: ClientFieldConfig[]
  createMappedComponent: CreateMappedComponent
  disableAddingID?: boolean
  fields: Field[]
  i18n: I18nClient
  importMap: ImportMap
  parentPath?: string
  payload: Payload
}): ClientFieldConfig[] => {
  const newClientFields: ClientFieldConfig[] = []
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    const newField = createClientFieldConfig({
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

  const hasID =
    newClientFields.findIndex((f) => 'name' in f && f._isFieldAffectingData && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    newClientFields.push({
      name: 'id',
      type: payload.db.defaultIDType === 'number' ? 'number' : 'text',
      _fieldIsPresentational: false,
      _isFieldAffectingData: true,
      admin: {
        components: {
          Field: null,
        },
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
