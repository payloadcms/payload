import type { I18nClient } from '@payloadcms/translations'
import type {
  BlocksFieldClient,
  ClientFieldConfig,
  ClientTab,
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

function generateFieldPath(parentPath, name) {
  let tabPath = parentPath || ''
  if (parentPath && name) {
    tabPath = `${parentPath}.${name}`
  } else if (!parentPath && name) {
    tabPath = name
  }

  return tabPath
}

export const createClientFieldConfig = ({
  createMappedComponent,
  field: incomingField,
  i18n,
  importMap,
  parentPath,
  payload,
}: {
  createMappedComponent: CreateMappedComponent
  field: Field
  i18n: I18nClient
  importMap: ImportMap
  parentPath?: string
  payload: Payload
}): ClientFieldConfig => {
  const _field: ClientFieldConfig = { ...(incomingField as any as ClientFieldConfig) } // invert the type

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
    if (key in _field) {
      delete _field[key]
    }
  })

  _field._isPresentational = fieldIsPresentationalOnly(_field)
  _field._isAffectingData = fieldAffectsData(_field)
  _field._isSidebar = fieldIsSidebar(_field)

  const isHidden = 'hidden' in _field && _field?.hidden
  const disabledFromAdmin = _field?.admin && 'disabled' in _field.admin && _field.admin.disabled

  if (_field._isAffectingData && (isHidden || disabledFromAdmin)) {
    return null
  }

  _field._path = generateFieldPath(
    parentPath,
    _field._isAffectingData && 'name' in _field ? _field.name : '',
  )

  if ('label' in _field && 'label' in incomingField && typeof incomingField.label === 'function') {
    _field.label = incomingField.label({ t: i18n.t })
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
      const field = _field as unknown as RowFieldClient

      field.fields = createClientFieldConfigs({
        createMappedComponent,
        disableAddingID: incomingField.type !== 'array',
        fields: incomingField.fields,
        i18n,
        importMap,
        parentPath: field._path,
        payload,
      })

      if (incomingField?.admin?.components && 'RowLabel' in incomingField.admin.components) {
        _field.admin.components.RowLabel = createMappedComponent(
          incomingField.admin.components.RowLabel,
        )
      }

      break
    }

    case 'blocks': {
      const field = _field as BlocksFieldClient

      // @ts-expect-error // TODO: fix this type issue
      field.blocks = incomingField.blocks?.map((block) => {
        const sanitized = { ...block, fields: [...block.fields] }

        // @ts-expect-error // TODO: fix this type issue
        sanitized.fields = createClientFieldConfigs({
          createMappedComponent,
          fields: sanitized.fields,
          i18n,
          importMap,
          parentPath: field._path,
          payload,
        })

        return sanitized
      })

      break
    }

    case 'richText': {
      const field = _field as RichTextFieldClient

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

      field.admin.components.Field = createMappedComponent(incomingField.editor.FieldComponent)
      field.admin.components.Cell = createMappedComponent(incomingField.editor.CellComponent)

      if (incomingField.editor.generateComponentMap) {
        const { Component: generateComponentMap, serverProps } = getComponent({
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
      const field = _field as unknown as TabsFieldClient

      field.tabs = field.tabs?.map((tab) => {
        const clientTab: ClientTab = { ...tab }

        serverOnlyFieldProperties.forEach((key) => {
          if (key in clientTab) {
            delete clientTab[key]
          }
        })

        clientTab.fields = createClientFieldConfigs({
          createMappedComponent,
          disableAddingID: true,
          fields: tab.fields as unknown as Field[],
          i18n,
          importMap,
          parentPath: field._path,
          payload,
        })

        return clientTab
      })

      break
    }

    case 'select': {
      const field = _field as SelectFieldClient

      field.options = field.options.map((option) => {
        if (typeof option === 'object' && typeof option.label === 'function') {
          return {
            label: option.label({ t: i18n.t }),
            value: option.value,
          }
        }

        return option
      })

      break
    }

    case 'radio': {
      const field = _field as RadioFieldClient

      field.options = field.options.map((option) => {
        if (typeof option === 'object' && typeof option.label === 'function') {
          return {
            label: option.label({ t: i18n.t }),
            value: option.value,
          }
        }

        return option
      })

      break
    }
    default:
      break
  }

  const serverOnlyFieldAdminProperties: Partial<ServerOnlyFieldAdminProperties>[] = ['condition']

  _field.admin = { ...(_field?.admin || ({} as any)) }

  if (!_field.admin.components) {
    _field.admin.components = {}
  }

  serverOnlyFieldAdminProperties.forEach((key) => {
    if (key in _field.admin) {
      delete _field.admin[key]
    }
  })

  if (incomingField.admin && 'description' in incomingField.admin) {
    if (
      typeof incomingField.admin?.description === 'string' ||
      typeof incomingField.admin?.description === 'object'
    ) {
      _field.admin.description = incomingField.admin.description
    } else if (typeof incomingField.admin?.description === 'function') {
      _field.admin.description = incomingField.admin?.description({ t: i18n.t })
    }
  }

  if (!_field.admin.components.Cell && incomingField?.admin?.components?.Cell !== undefined) {
    _field.admin.components.Cell = createMappedComponent(incomingField.admin.components.Cell)
  }

  if (
    !_field.admin.components.Description &&
    incomingField?.admin?.components &&
    'Description' in incomingField.admin.components &&
    incomingField?.admin?.components?.Description !== undefined
  ) {
    _field.admin.components.Description = createMappedComponent(
      incomingField.admin.components.Description,
    )
  }

  if (
    !_field.admin.components.Error &&
    incomingField?.admin?.components &&
    'Error' in incomingField.admin.components &&
    incomingField.admin.components.Error !== undefined
  ) {
    _field.admin.components.Error = createMappedComponent(incomingField.admin.components.Error)
  }

  if (!_field.admin.components.Field && incomingField?.admin?.components?.Field !== undefined) {
    _field.admin.components.Field = createMappedComponent(incomingField.admin.components.Field)
  }

  if (
    !_field.admin.components.Filter &&
    incomingField?.admin?.components &&
    'Filter' in incomingField.admin.components &&
    incomingField.admin.components.Filter !== undefined
  ) {
    _field.admin.components.Filter = createMappedComponent(incomingField.admin.components.Filter)
  }

  if (
    !_field.admin.components.Label &&
    incomingField?.admin?.components &&
    'Label' in incomingField.admin.components &&
    incomingField.admin.components.Label !== undefined
  ) {
    _field.admin.components.Label = createMappedComponent(CustomLabel)
  }

  if (
    !_field.admin.components.beforeInput &&
    incomingField?.admin?.components &&
    'beforeInput' in incomingField.admin.components &&
    incomingField.admin.components.beforeInput !== undefined
  ) {
    _field.admin.components.beforeInput = createMappedComponent(
      incomingField.admin?.components?.beforeInput,
    )
  }

  if (
    !_field.admin.components.afterInput &&
    incomingField?.admin?.components &&
    'afterInput' in incomingField.admin.components &&
    incomingField.admin.components.afterInput !== undefined
  ) {
    _field.admin.components.afterInput = createMappedComponent(
      incomingField.admin?.components?.afterInput,
    )
  }

  return _field
}

export const createClientFieldConfigs = ({
  createMappedComponent,
  disableAddingID,
  fields,
  i18n,
  importMap,
  parentPath,
  payload,
}: {
  createMappedComponent: CreateMappedComponent
  disableAddingID?: boolean
  fields: Field[]
  i18n: I18nClient
  importMap: ImportMap
  parentPath?: string
  payload: Payload
}): ClientFieldConfig[] => {
  const result = [...fields]
    .map((field) =>
      createClientFieldConfig({
        createMappedComponent,
        field,
        i18n,
        importMap,
        parentPath,
        payload,
      }),
    )
    .filter(Boolean)

  const hasID = result.findIndex((f) => 'name' in f && f._isAffectingData && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    result.push({
      name: 'id',
      type: payload.db.defaultIDType === 'number' ? 'number' : 'text',
      _isPresentational: false,
      _isAffectingData: true,
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

  return result
}
