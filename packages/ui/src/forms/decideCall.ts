import type { ComponentIndex, IndexedComponent } from 'payload'

import { detectStructural } from './detectStructural.js'
import { diffVisibility } from './diffVisibility.js'

export type DecideCallTarget = {
  /**
   * Module path/specifier of the component as recorded in the component index
   * (e.g. `./collections/Posts/TextField.js#CustomTextField`). Forwarded so
   * downstream consumers can resolve the ref against the client import
   * registry without re-walking `componentRefs`.
   */
  componentPath: string
  /**
   * Source-text kind copied from the originating `IndexedComponent`. The
   * dispatcher in `Edit/index.tsx` reads this to split targets into
   * client-mounted vs. server-rendered without any runtime `$$typeof`
   * inspection — see Phase 13 of the form-state plan.
   */
  kind: IndexedComponent['kind']
  path: string
  slot: IndexedComponent['slot']
}

export type Decision = {
  targets: DecideCallTarget[]
} | null

export type DecideCallInput = {
  index: ComponentIndex
  next: {
    values: Record<string, unknown>
    visibility: Map<string, boolean>
  }
  prev: {
    values: Record<string, unknown>
    visibility: Map<string, boolean>
  }
  /**
   * Set of `${path}|${slot}` keys for components already realized this session.
   * Caller derives this from existing form state (rendered customComponents) —
   * the helper itself is stateless. Plan 5.4 wires the derivation.
   */
  realized: Set<string>
}

export function decideCall(input: DecideCallInput): Decision {
  const seen = new Set<string>()
  const targets: DecideCallTarget[] = []

  const consider = (component: IndexedComponent): void => {
    const key = `${component.path}|${component.slot}`
    if (seen.has(key) || input.realized.has(key)) {
      return
    }
    seen.add(key)
    targets.push({
      componentPath: component.componentPath,
      kind: component.kind,
      path: component.path,
      slot: component.slot,
    })
  }

  const { newlyVisible } = diffVisibility(input.prev.visibility, input.next.visibility)
  for (const path of newlyVisible) {
    for (const component of input.index.componentsAt(path)) {
      consider(component)
    }
  }

  const adds = detectStructural(input.prev.values, input.next.values).filter(
    (event) => event.kind === 'add',
  )
  for (const event of adds) {
    for (const component of input.index.componentsAt(event.path)) {
      consider(component)
    }
  }

  if (targets.length === 0) {
    return null
  }
  return { targets }
}
