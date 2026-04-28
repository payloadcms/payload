import type { Field, Tab } from '../fields/config/types.js'
import type { PayloadComponent, SanitizedConfig } from './types.js'

export type ComponentSlot =
  | 'afterInput'
  | 'beforeInput'
  | 'Description'
  | 'Error'
  | 'Field'
  | 'Label'
  | 'RowLabel'

export type ComponentKind = 'client' | 'server'

export type IndexedComponent = {
  componentPath: string
  kind: ComponentKind
  path: string
  slot: ComponentSlot
}

export type ComponentIndex = {
  all(): IndexedComponent[]
  componentsAt(subtreePath: string): IndexedComponent[]
}

export type ComponentKindClassifier = (componentPath: string) => ComponentKind

const SLOTS: ComponentSlot[] = [
  'Field',
  'beforeInput',
  'afterInput',
  'RowLabel',
  'Label',
  'Description',
  'Error',
]

export function buildComponentIndex(
  config: SanitizedConfig,
  classify: ComponentKindClassifier,
): ComponentIndex {
  const components: IndexedComponent[] = []

  for (const collection of config.collections ?? []) {
    walkFields({
      classify,
      fields: collection.fields ?? [],
      out: components,
      pathSegments: [collection.slug],
    })
  }

  for (const global of config.globals ?? []) {
    walkFields({
      classify,
      fields: global.fields ?? [],
      out: components,
      pathSegments: [global.slug],
    })
  }

  return {
    all: () => components.slice(),
    componentsAt: (subtreePath) => filterToSubtree(components, subtreePath),
  }
}

// Schema walker for the component index. Keep in sync with the equivalent
// walker in packages/payload/src/admin/buildImportMaps.ts until both are
// extracted into a shared helper.
function walkFields({
  classify,
  fields,
  out,
  pathSegments,
}: {
  classify: ComponentKindClassifier
  fields: Field[]
  out: IndexedComponent[]
  pathSegments: string[]
}): void {
  for (const field of fields) {
    const fieldPath = computeFieldPath(field, pathSegments)
    collectSlots({ classify, field, out, path: fieldPath.join('.') })

    switch (field.type) {
      case 'array': {
        walkFields({
          classify,
          fields: field.fields ?? [],
          out,
          pathSegments: [...fieldPath, '*'],
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
            fields: block.fields ?? [],
            out,
            pathSegments: [...fieldPath, '*'],
          })
        }
        break
      }
      case 'collapsible':
      case 'row': {
        walkFields({ classify, fields: field.fields ?? [], out, pathSegments })
        break
      }
      case 'group': {
        walkFields({ classify, fields: field.fields ?? [], out, pathSegments: fieldPath })
        break
      }
      case 'tabs': {
        for (const tab of field.tabs ?? []) {
          const tabSegments = isNamedTab(tab) ? [...pathSegments, tab.name] : pathSegments
          walkFields({
            classify,
            fields: tab.fields ?? [],
            out,
            pathSegments: tabSegments,
          })
        }
        break
      }
      default:
        break
    }
  }
}

function computeFieldPath(field: Field, parentSegments: string[]): string[] {
  if ('name' in field && typeof field.name === 'string' && field.name.length > 0) {
    return [...parentSegments, field.name]
  }
  return parentSegments
}

function collectSlots({
  classify,
  field,
  out,
  path,
}: {
  classify: ComponentKindClassifier
  field: Field
  out: IndexedComponent[]
  path: string
}): void {
  const components = (field as { admin?: { components?: Record<string, unknown> } }).admin
    ?.components
  if (!components) {
    return
  }

  for (const slot of SLOTS) {
    const value = components[slot]
    if (!value) {
      continue
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        const componentPath = resolveComponentPath(entry as PayloadComponent)
        if (componentPath) {
          out.push({ componentPath, kind: classify(componentPath), path, slot })
        }
      }
    } else {
      const componentPath = resolveComponentPath(value as PayloadComponent)
      if (componentPath) {
        out.push({ componentPath, kind: classify(componentPath), path, slot })
      }
    }
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

function isNamedTab(tab: Tab): tab is Extract<Tab, { name: string }> {
  return typeof (tab as { name?: unknown }).name === 'string'
}

function filterToSubtree(components: IndexedComponent[], subtreePath: string): IndexedComponent[] {
  if (!subtreePath || !subtreePath.trim()) {
    return []
  }
  const subtreeSegments = subtreePath.split('.')
  const matches: IndexedComponent[] = []

  for (const component of components) {
    const componentSegments = component.path.split('.')
    if (componentSegments.length < subtreeSegments.length) {
      continue
    }

    const specialized: string[] = []
    let isMatch = true
    for (let i = 0; i < subtreeSegments.length; i++) {
      const subtreeSeg = subtreeSegments[i]!
      const componentSeg = componentSegments[i]!
      if (componentSeg === subtreeSeg) {
        specialized.push(componentSeg)
        continue
      }
      if (componentSeg === '*' && /^\d+$/.test(subtreeSeg)) {
        specialized.push(subtreeSeg)
        continue
      }
      isMatch = false
      break
    }

    if (!isMatch) {
      continue
    }

    const tail = componentSegments.slice(subtreeSegments.length)
    matches.push({ ...component, path: [...specialized, ...tail].join('.') })
  }

  return matches
}
