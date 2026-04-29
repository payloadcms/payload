import { parsePayloadComponent } from 'payload/shared'

import type { ClientImportRegistry } from '../utilities/clientImportRegistry.js'

type ValidatorRef = { exportName?: string; path: string } | string

export type RunAdminValidateContext = {
  data: unknown
  operation: 'create' | 'update' | undefined
  siblingData: unknown
  user: unknown
}

export type RunAdminValidateInput = {
  context: RunAdminValidateContext
  registry: ClientImportRegistry
  validators: Array<{ path: string; ref: ValidatorRef }>
  values: Record<string, unknown>
}

export async function runAdminValidate(input: RunAdminValidateInput): Promise<Map<string, string>> {
  const errors = new Map<string, string>()

  await Promise.all(
    input.validators.map(async (v) => {
      const parsed = parsePayloadComponent(v.ref as Parameters<typeof parsePayloadComponent>[0])
      if (!parsed) {
        errors.set(v.path, `admin.validate ref "${stringifyRef(v.ref)}" is not parseable`)
        return
      }
      const { exportName, path: importPath } = parsed
      const key = `${importPath}#${exportName}`

      try {
        const mod = await input.registry.resolve(key)
        if (mod == null) {
          errors.set(v.path, `admin.validate import "${key}" not found in client registry`)
          return
        }
        const fn = (mod as Record<string, unknown>)[exportName]
        if (typeof fn !== 'function') {
          errors.set(v.path, `admin.validate import "${key}" did not resolve to a function`)
          return
        }
        const result = (fn as (value: unknown, ctx: RunAdminValidateContext) => unknown)(
          input.values[v.path],
          input.context,
        )
        if (isPromise(result)) {
          return // async — skip on edit path
        }
        if (result !== true) {
          errors.set(v.path, String(result))
        }
      } catch (err) {
        errors.set(v.path, err instanceof Error ? err.message : 'admin.validate threw')
      }
    }),
  )

  return errors
}

function isPromise(value: unknown): boolean {
  return Boolean(value) && typeof (value as { then?: unknown }).then === 'function'
}

function stringifyRef(ref: ValidatorRef): string {
  return typeof ref === 'string' ? ref : `${ref.path}#${ref.exportName ?? 'default'}`
}
