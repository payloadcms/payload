import type { Field } from '../fields/config/types.js'
import type { PayloadComponent, SanitizedConfig } from './types.js'

import { walkSchema } from './walkSchema.js'

export type ComponentSlot =
  | 'afterInput'
  | 'beforeInput'
  | 'Description'
  | 'Error'
  | 'Field'
  | 'Label'
  | 'RowLabel'

export type IndexedComponent = {
  componentPath: string
  path: string
  slot: ComponentSlot
}

export type ComponentIndex = {
  all(): IndexedComponent[]
  componentsAt(subtreePath: string): IndexedComponent[]
}

export const COMPONENT_SLOTS: ComponentSlot[] = [
  'Field',
  'beforeInput',
  'afterInput',
  'RowLabel',
  'Label',
  'Description',
  'Error',
]

export function buildComponentIndex(config: SanitizedConfig): ComponentIndex {
  const components: IndexedComponent[] = []

  walkSchema(config, ({ field, fieldPath }) => {
    collectSlots({ field, out: components, path: fieldPath })
  })

  return {
    all: () => components.slice(),
    componentsAt: (subtreePath) => filterRefsToSubtree(components, subtreePath),
  }
}

/**
 * Filters indexed components down to those rooted at `subtreePath`, specializing
 * any wildcard (`*`) segments against numeric segments in `subtreePath` so that
 * results carry concrete paths (e.g. `orders.lineItems.*.sku` becomes
 * `orders.lineItems.5.sku` when called with `orders.lineItems.5`).
 *
 * Exported so the client-side wrapper in `@payloadcms/ui` can reuse the same
 * lookup semantics over `clientConfig.componentRefs`.
 */
export function filterRefsToSubtree(
  refs: IndexedComponent[],
  subtreePath: string,
): IndexedComponent[] {
  if (!subtreePath || !subtreePath.trim()) {
    return []
  }
  const subtreeSegments = subtreePath.split('.')
  const matches: IndexedComponent[] = []

  for (const component of refs) {
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

function collectSlots({
  field,
  out,
  path,
}: {
  field: Field
  out: IndexedComponent[]
  path: string
}): void {
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
        const componentPath = resolveComponentPath(entry as PayloadComponent)
        if (componentPath) {
          out.push({ componentPath, path, slot })
        }
      }
    } else {
      const componentPath = resolveComponentPath(value as PayloadComponent)
      if (componentPath) {
        out.push({ componentPath, path, slot })
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
