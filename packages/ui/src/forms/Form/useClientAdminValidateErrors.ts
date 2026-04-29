'use client'

import type { ClientConfig, FormState } from 'payload'

import { parsePayloadComponent } from 'payload/shared'
import { useEffect, useMemo, useState } from 'react'

import type { ClientImportRegistry } from '../../utilities/clientImportRegistry.js'

type AdminValidateContext = {
  data: unknown
  operation: 'create' | 'update' | undefined
  siblingData: unknown
  user: unknown
}

type ValidatorFn = (value: unknown, ctx: AdminValidateContext) => unknown

export type UseClientAdminValidateErrorsArgs = {
  context: AdminValidateContext
  formState: FormState
  refs: ClientConfig['adminValidateRefs']
  registry: ClientImportRegistry | null
  values: Record<string, unknown>
}

/**
 * Pre-resolves admin.validate refs at mount via the client import registry, then
 * recomputes an error map on every form-state change. Returned map is fed into
 * `<AdminValidateErrorsProvider>` so descendants can opt into client-side
 * validation as a parallel signal alongside the existing `errorMessage` flow.
 *
 * Inline validators (already filtered server-side via the `<inline>` marker) are
 * absent from `refs`. Refs that fail to resolve are skipped silently — the field
 * falls back to the server-driven validation pipeline.
 *
 * Async validators are treated as no-ops on the edit path (mirrors the rule in
 * `runAdminValidate`); they continue to surface via the server pipeline.
 */
export function useClientAdminValidateErrors(
  args: UseClientAdminValidateErrorsArgs,
): Map<string, string> {
  const { context, refs, registry, values } = args

  const [resolved, setResolved] = useState<Map<string, ValidatorFn>>(() => new Map())

  useEffect(() => {
    if (!registry || !refs || refs.length === 0) {
      return
    }
    let cancelled = false
    const results = new Map<string, ValidatorFn>()
    Promise.all(
      refs.map(async ({ fieldPath, ref }) => {
        const parsed = parsePayloadComponent(ref as Parameters<typeof parsePayloadComponent>[0])
        if (!parsed) {
          return
        }
        const { exportName, path: importPath } = parsed
        const key = `${importPath}#${exportName}`
        try {
          const mod = await registry.resolve(key)
          if (cancelled) {
            return
          }
          if (mod == null) {
            // Unresolved refs are skipped silently; the field falls back to
            // the server-driven validation signal that already gates errors.
            return
          }
          const fn = (mod as Record<string, unknown>)[exportName]
          if (typeof fn !== 'function') {
            return
          }
          results.set(fieldPath, fn as ValidatorFn)
        } catch {
          // Same failure mode as above: skip silently and let the server-driven
          // signal carry the field's validation.
        }
      }),
    )
      .then(() => {
        if (!cancelled) {
          setResolved(results)
        }
      })
      .catch(() => {
        // Promise.all swallows individual rejections via the per-ref catch above;
        // the outer .catch only handles catastrophic failures (registry errors).
      })
    return () => {
      cancelled = true
    }
    // refs is derived from clientConfig and is referentially stable for the
    // lifetime of a given config. registry is stable for the provider lifetime.
  }, [refs, registry])

  return useMemo(() => {
    if (resolved.size === 0) {
      return new Map<string, string>()
    }
    const errors = new Map<string, string>()
    for (const [path, fn] of resolved) {
      try {
        const result = fn(values[path], context)
        if (isPromise(result)) {
          // async — skip on edit path, mirroring runAdminValidate.
          continue
        }
        if (result !== true) {
          errors.set(path, String(result))
        }
      } catch (err) {
        errors.set(path, err instanceof Error ? err.message : 'admin.validate threw')
      }
    }
    return errors
  }, [context, resolved, values])
}

function isPromise(value: unknown): boolean {
  return Boolean(value) && typeof (value as { then?: unknown }).then === 'function'
}
