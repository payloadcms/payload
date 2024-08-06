import type { TFunction } from '@payloadcms/translations'
import type {
  ClientFieldConfig,
  CreateMappedComponent,
  Field,
  LabelComponent,
  Payload,
  RowLabelComponent,
  ServerOnlyFieldAdminProperties,
  ServerOnlyFieldProperties,
} from 'payload'

import { fieldAffectsData, fieldIsPresentationalOnly, fieldIsSidebar } from 'payload/shared'

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
  parentPath,
  payload,
  t,
}: {
  createMappedComponent: CreateMappedComponent
  field: Field
  parentPath?: string
  payload: Payload
  t: TFunction
}): ClientFieldConfig => {
  const field: ClientFieldConfig = { ...(incomingField as any as ClientFieldConfig) } // invert the type

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
    if (key in field) {
      delete field[key]
    }
  })

  field._fieldIsPresentational = fieldIsPresentationalOnly(field)
  field._isFieldAffectingData = fieldAffectsData(field)
  field._isSidebar = fieldIsSidebar(field)

  const isHidden = 'hidden' in field && field?.hidden
  const isHiddenFromAdmin = field?.admin && 'hidden' in field.admin && field.admin.hidden
  const disabledFromAdmin = field?.admin && 'disabled' in field.admin && field.admin.disabled

  if (field._isFieldAffectingData && (isHidden || disabledFromAdmin)) {
    return null
  }

  field._path = generateFieldPath(
    parentPath,
    field._isFieldAffectingData && 'name' in field ? field.name : '',
  )

  if ('label' in field && typeof field.label === 'function') {
    field.label = field.label({ t })
  }

  let CustomLabel: LabelComponent | RowLabelComponent =
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Label' in incomingField.admin.components &&
    incomingField.admin.components.Label

  switch (field.type) {
    case 'array':
    case 'group':
    case 'collapsible':
    case 'row': {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.fields = [...(incomingField.fields as Field[])]

      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.fields = createClientFieldConfigs({
        createMappedComponent,
        disableAddingID: field.type !== 'array',
        // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
        fields: field.fields,
        parentPath: field._path,
        payload,
        t,
      })

      if (field.type === 'array') {
        // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
        field.RowLabel = createMappedComponent(CustomLabel)
      }

      if (field.type === 'collapsible') {
        if (
          'admin' in incomingField &&
          'components' in incomingField.admin &&
          'RowLabel' in incomingField.admin.components &&
          incomingField.admin.components.RowLabel
        ) {
          CustomLabel = incomingField.admin.components.RowLabel
        }
      }

      break
    }

    case 'blocks': {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.blocks = field.blocks?.map((block) => {
        const sanitized = { ...block, fields: [...block.fields] }

        sanitized.fields = createClientFieldConfigs({
          createMappedComponent,
          fields: sanitized.fields,
          parentPath: field._path,
          payload,
          t,
        })

        return sanitized
      })

      break
    }

    case 'tabs': {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.tabs = field.tabs?.map((tab) => {
        const sanitized = { ...tab, fields: [...tab.fields] }

        sanitized.fields = createClientFieldConfigs({
          createMappedComponent,
          disableAddingID: true,
          fields: sanitized.fields,
          parentPath: field._path,
          payload,
          t,
        })

        return sanitized
      })

      break
    }

    case 'select': {
      // @ts-expect-error // TODO: see note in `ClientFieldConfig` about <Omit> breaking the inference here
      field.options = field.options.map((option) => {
        if (typeof option === 'object' && typeof option.label === 'function') {
          return {
            label: option.label({ t }),
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

  field.admin = { ...(field?.admin || ({} as any)) }

  serverOnlyFieldAdminProperties.forEach((key) => {
    if (key in field.admin) {
      delete field.admin[key]
    }
  })

  if (incomingField.admin && 'description' in incomingField.admin) {
    if (
      typeof incomingField.admin?.description === 'string' ||
      typeof incomingField.admin?.description === 'object'
    ) {
      field.admin.description = incomingField.admin.description
    } else if (typeof incomingField.admin?.description === 'function') {
      field.admin.description = incomingField.admin?.description({ t })
    }
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Cell' in incomingField.admin.components &&
    incomingField.admin.components.Cell &&
    incomingField.admin.components.Cell !== undefined
  ) {
    field.admin.components.Cell = createMappedComponent(incomingField.admin.components.Cell)
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Description' in incomingField.admin.components &&
    incomingField.admin.components.Description !== undefined
  ) {
    field.admin.components.Description = createMappedComponent(
      incomingField.admin.components.Description,
    )
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Error' in incomingField.admin.components &&
    incomingField.admin.components.Error !== undefined
  ) {
    field.admin.components.Error = createMappedComponent(incomingField.admin.components.Error)
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Field' in incomingField.admin.components &&
    incomingField.admin.components.Field !== undefined
  ) {
    field.admin.components.Field = createMappedComponent(incomingField.admin.components.Field)
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Filter' in incomingField.admin.components &&
    incomingField.admin.components.Filter !== undefined
  ) {
    field.admin.components.Filter = createMappedComponent(incomingField.admin.components.Filter)
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'Label' in incomingField.admin.components &&
    incomingField.admin.components.Label !== undefined
  ) {
    field.admin.components.Label = createMappedComponent(CustomLabel)
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'beforeInput' in incomingField.admin.components &&
    incomingField.admin.components.beforeInput !== undefined
  ) {
    field.admin.components.beforeInput = createMappedComponent(
      incomingField.admin?.components?.beforeInput,
    )
  }

  if (
    'admin' in incomingField &&
    'components' in incomingField.admin &&
    'afterInput' in incomingField.admin.components &&
    incomingField.admin.components.afterInput !== undefined
  ) {
    field.admin.components.afterInput = createMappedComponent(
      incomingField.admin?.components?.afterInput,
    )
  }

  return field
}

export const createClientFieldConfigs = ({
  createMappedComponent,
  disableAddingID,
  fields,
  parentPath,
  payload,
  t,
}: {
  createMappedComponent: CreateMappedComponent
  disableAddingID?: boolean
  fields: Field[]
  parentPath?: string
  payload: Payload
  t: TFunction
}): ClientFieldConfig[] => {
  const result = [...fields]
    .map((field) =>
      createClientFieldConfig({ createMappedComponent, field, parentPath, payload, t }),
    )
    .filter(Boolean)

  const hasID =
    result.findIndex((f) => 'name' in f && f._isFieldAffectingData && f.name === 'id') > -1

  if (!disableAddingID && !hasID) {
    result.push({
      name: 'id',
      type: payload.db.defaultIDType === 'number' ? 'number' : 'text',
      _fieldIsPresentational: false,
      _isFieldAffectingData: true,
      admin: {
        components: {
          Field: null,
        },
        disableBulkEdit: true,
      },
      hidden: true,
      label: 'ID',
      localized: undefined,
    })
  }

  return result
}
