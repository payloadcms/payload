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
  const { context, formState, refs, registry, values } = args

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
          // `<inline>` refs are filtered server-side; reaching this branch means
          // a ref slipped through the filter. The field falls back to the
          // server-driven signal but the import-map likely has a stale entry.
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[payload] admin.validate ref could not be parsed', { fieldPath, ref })
          }
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
            // `has(key) === false` is the expected fallback path (ref not yet
            // bundled into the import map) — stay silent. Otherwise the ref is
            // registered but its factory returned nothing, which is genuinely
            // misconfigured.
            if (process.env.NODE_ENV !== 'production' && registry.has(key)) {
              // eslint-disable-next-line no-console
              console.warn(
                '[payload] admin.validate ref resolved to null/undefined; falling back to server validation',
                { fieldPath, path: key, ref },
              )
            }
            return
          }
          const fn = (mod as Record<string, unknown>)[exportName]
          if (typeof fn !== 'function') {
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.warn(
                '[payload] admin.validate ref did not resolve to a function; falling back to server validation',
                { type: typeof fn, exportName, fieldPath, path: key, ref },
              )
            }
            return
          }
          results.set(fieldPath, fn as ValidatorFn)
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(
              '[payload] admin.validate ref threw during resolution; falling back to server validation',
              { err, fieldPath, path: key, ref },
            )
          }
        }
      }),
    )
      .then(() => {
        if (!cancelled) {
          setResolved(results)
        }
      })
      .catch((err) => {
        // Promise.all swallows individual rejections via the per-ref catch above;
        // the outer .catch only handles catastrophic failures (registry errors).
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[payload] admin.validate registry resolution failed catastrophically', {
            err,
          })
        }
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
      // Phase 10: only run admin.validate on fields the user has touched.
      // Untouched fields (e.g., empty required strings at boot) shouldn't
      // surface a validation error before any interaction. Save-time
      // validation still gates submit through the legacy server pipeline.
      if (!formState[path]?.isModified) {
        continue
      }
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
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[payload] admin.validate threw during invocation', {
            err,
            fieldPath: path,
          })
        }
        errors.set(path, err instanceof Error ? err.message : 'admin.validate threw')
      }
    }
    return errors
  }, [context, formState, resolved, values])
}

function isPromise(value: unknown): boolean {
  return Boolean(value) && typeof (value as { then?: unknown }).then === 'function'
}
