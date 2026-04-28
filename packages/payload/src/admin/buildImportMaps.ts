import type { ComponentKindClassifier, ComponentSlot } from '../config/buildComponentIndex.js'
import type { PayloadComponent, SanitizedConfig } from '../config/types.js'
import type { Field, Tab } from '../fields/config/types.js'

export type ImportMapEntryKind =
  | 'admin-condition'
  | 'admin-validate'
  | 'component'
  | 'hook'
  | 'validate'

export type ImportMapEntry = {
  exportName?: string
  fieldPath?: string
  kind: ImportMapEntryKind
  path: string
  slot?: ComponentSlot
}

export type ImportMaps = {
  client: { entries: ImportMapEntry[] }
  server: { entries: ImportMapEntry[] }
}

const INLINE_PATH_MARKER = '<inline>'

const COMPONENT_SLOTS: ComponentSlot[] = [
  'Field',
  'beforeInput',
  'afterInput',
  'RowLabel',
  'Label',
  'Description',
  'Error',
]

export function buildImportMaps(
  config: SanitizedConfig,
  classify: ComponentKindClassifier,
): ImportMaps {
  const serverEntries: ImportMapEntry[] = []
  const clientEntries: ImportMapEntry[] = []

  for (const collection of config.collections ?? []) {
    walkFields({
      classify,
      clientEntries,
      fields: collection.fields ?? [],
      pathSegments: [collection.slug],
      serverEntries,
    })
  }

  for (const global of config.globals ?? []) {
    walkFields({
      classify,
      clientEntries,
      fields: global.fields ?? [],
      pathSegments: [global.slug],
      serverEntries,
    })
  }

  return {
    client: { entries: clientEntries },
    server: { entries: serverEntries },
  }
}

function walkFields({
  classify,
  clientEntries,
  fields,
  pathSegments,
  serverEntries,
}: {
  classify: ComponentKindClassifier
  clientEntries: ImportMapEntry[]
  fields: Field[]
  pathSegments: string[]
  serverEntries: ImportMapEntry[]
}): void {
  for (const field of fields) {
    const fieldPathSegments = computeFieldPath(field, pathSegments)
    const fieldPath = fieldPathSegments.join('.')

    collectFieldEntries({
      classify,
      clientEntries,
      field,
      fieldPath,
      serverEntries,
    })

    switch (field.type) {
      case 'array': {
        walkFields({
          classify,
          clientEntries,
          fields: field.fields ?? [],
          pathSegments: [...fieldPathSegments, '*'],
          serverEntries,
        })
        break
      }
      case 'blocks': {
        const blocks = (field.blocks ?? []).filter(
          (block): block is Exclude<typeof block, string> => typeof block !== 'string',
        )
        for (const block of blocks) {
          walkFields({
            classify,
            clientEntries,
            fields: block.fields ?? [],
            pathSegments: [...fieldPathSegments, '*'],
            serverEntries,
          })
        }
        break
      }
      case 'collapsible':
      case 'row': {
        walkFields({
          classify,
          clientEntries,
          fields: field.fields ?? [],
          pathSegments,
          serverEntries,
        })
        break
      }
      case 'group': {
        walkFields({
          classify,
          clientEntries,
          fields: field.fields ?? [],
          pathSegments: fieldPathSegments,
          serverEntries,
        })
        break
      }
      case 'tabs': {
        for (const tab of field.tabs ?? []) {
          const tabSegments = isNamedTab(tab) ? [...pathSegments, tab.name] : pathSegments
          walkFields({
            classify,
            clientEntries,
            fields: tab.fields ?? [],
            pathSegments: tabSegments,
            serverEntries,
          })
        }
        break
      }
      default:
        break
    }
  }
}

function collectFieldEntries({
  classify,
  clientEntries,
  field,
  fieldPath,
  serverEntries,
}: {
  classify: ComponentKindClassifier
  clientEntries: ImportMapEntry[]
  field: Field
  fieldPath: string
  serverEntries: ImportMapEntry[]
}): void {
  if ((field as { validate?: unknown }).validate !== undefined) {
    serverEntries.push({ fieldPath, kind: 'validate', path: INLINE_PATH_MARKER })
  }

  const admin = (field as { admin?: { condition?: unknown; validate?: unknown } }).admin

  if (admin?.condition !== undefined) {
    const conditionPath = typeof admin.condition === 'string' ? admin.condition : INLINE_PATH_MARKER
    clientEntries.push({ fieldPath, kind: 'admin-condition', path: conditionPath })
  }

  if (admin?.validate !== undefined) {
    const validatePath = typeof admin.validate === 'string' ? admin.validate : INLINE_PATH_MARKER
    clientEntries.push({ fieldPath, kind: 'admin-validate', path: validatePath })
  }

  const components = (field as { admin?: { components?: Record<string, unknown> } }).admin
    ?.components
  if (!components) {
    return
  }

  for (const slot of COMPONENT_SLOTS) {
    const value = components[slot]
    if (!value) {
      continue
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        emitComponentEntry({
          classify,
          clientEntries,
          component: entry as PayloadComponent,
          fieldPath,
          serverEntries,
          slot,
        })
      }
    } else {
      emitComponentEntry({
        classify,
        clientEntries,
        component: value as PayloadComponent,
        fieldPath,
        serverEntries,
        slot,
      })
    }
  }
}

function emitComponentEntry({
  classify,
  clientEntries,
  component,
  fieldPath,
  serverEntries,
  slot,
}: {
  classify: ComponentKindClassifier
  clientEntries: ImportMapEntry[]
  component: PayloadComponent | undefined
  fieldPath: string
  serverEntries: ImportMapEntry[]
  slot: ComponentSlot
}): void {
  const componentPath = resolveComponentPath(component)
  if (!componentPath) {
    return
  }

  const entry: ImportMapEntry = { fieldPath, kind: 'component', path: componentPath, slot }
  serverEntries.push(entry)

  if (classify(componentPath) === 'client') {
    clientEntries.push(entry)
  }
}

function resolveComponentPath(component: PayloadComponent | undefined): string | undefined {
  if (!component) {
    return undefined
  }
  if (typeof component === 'string') {
    return component
  }
  if (typeof component === 'object' && 'path' in component) {
    return component.path
  }
  return undefined
}

function computeFieldPath(field: Field, parentSegments: string[]): string[] {
  if ('name' in field && typeof field.name === 'string' && field.name.length > 0) {
    return [...parentSegments, field.name]
  }
  return parentSegments
}

function isNamedTab(tab: Tab): tab is Extract<Tab, { name: string }> {
  return typeof (tab as { name?: unknown }).name === 'string'
}
