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
      const { exportName, path: importPath } = normalizeRef(v.ref)
      try {
        const mod = await input.registry.resolve(importPath)
        if (mod == null) {
          errors.set(v.path, `admin.validate import "${importPath}" not found in client registry`)
          return
        }
        const fn = pickExport(mod, exportName)
        if (typeof fn !== 'function') {
          errors.set(v.path, `admin.validate import "${importPath}" did not resolve to a function`)
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

function normalizeRef(ref: ValidatorRef): { exportName?: string; path: string } {
  return typeof ref === 'string' ? { path: ref } : { exportName: ref.exportName, path: ref.path }
}

function pickExport(mod: unknown, exportName?: string): unknown {
  if (mod == null || typeof mod !== 'object') {
    return mod
  }
  const obj = mod as Record<string, unknown>
  if (exportName) {
    return obj[exportName]
  }
  return obj.default ?? mod
}

function isPromise(value: unknown): boolean {
  return Boolean(value) && typeof (value as { then?: unknown }).then === 'function'
}
