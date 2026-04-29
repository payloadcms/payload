import type { ComponentSlot } from '../config/buildComponentIndex.js'
import type { PayloadComponent, SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'

import { COMPONENT_SLOTS } from '../config/buildComponentIndex.js'
import { walkSchema } from '../config/walkSchema.js'

export type ImportMapEntryKind = 'admin-condition' | 'admin-validate' | 'component' | 'validate'

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

export function buildImportMaps(config: SanitizedConfig): ImportMaps {
  const serverEntries: ImportMapEntry[] = []
  const clientEntries: ImportMapEntry[] = []

  walkSchema(config, ({ field, fieldPath }) => {
    collectFieldEntries({ clientEntries, field, fieldPath, serverEntries })
  })

  return {
    client: { entries: clientEntries },
    server: { entries: serverEntries },
  }
}

function collectFieldEntries({
  clientEntries,
  field,
  fieldPath,
  serverEntries,
}: {
  clientEntries: ImportMapEntry[]
  field: Field
  fieldPath: string
  serverEntries: ImportMapEntry[]
}): void {
  if ((field as { validate?: unknown }).validate !== undefined) {
    serverEntries.push({ fieldPath, kind: 'validate', path: INLINE_PATH_MARKER })
  }

  // admin.validate is a Task 4 addition; duck-typed here for forward-compat.
  const admin = (field as { admin?: { condition?: unknown; validate?: unknown } }).admin

  if (admin?.condition !== undefined) {
    const conditionPath = typeof admin.condition === 'string' ? admin.condition : INLINE_PATH_MARKER
    clientEntries.push({ fieldPath, kind: 'admin-condition', path: conditionPath })
  }

  if (admin?.validate != null) {
    const validateRef = normalizeAdminValidateRef(admin.validate)
    if (validateRef) {
      clientEntries.push({
        fieldPath,
        kind: 'admin-validate',
        path: validateRef.path,
        ...(validateRef.exportName ? { exportName: validateRef.exportName } : {}),
      })
    } else {
      // Inline-function form (deprecated forward-compat path).
      clientEntries.push({ fieldPath, kind: 'admin-validate', path: INLINE_PATH_MARKER })
    }
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
          clientEntries,
          component: entry as PayloadComponent,
          fieldPath,
          serverEntries,
          slot,
        })
      }
    } else {
      emitComponentEntry({
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
  clientEntries,
  component,
  fieldPath,
  serverEntries,
  slot,
}: {
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
  clientEntries.push({ ...entry })
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

function normalizeAdminValidateRef(ref: unknown): { exportName?: string; path: string } | null {
  if (typeof ref === 'string') {
    return { path: ref }
  }
  if (
    ref &&
    typeof ref === 'object' &&
    'path' in ref &&
    typeof (ref as { path: unknown }).path === 'string'
  ) {
    const obj = ref as { exportName?: unknown; path: string }
    return {
      path: obj.path,
      ...(typeof obj.exportName === 'string' ? { exportName: obj.exportName } : {}),
    }
  }
  return null
}
