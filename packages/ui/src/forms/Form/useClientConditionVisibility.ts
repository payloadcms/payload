'use client'

import type { ClientConfig, FormState } from 'payload'

import { parsePayloadComponent } from 'payload/shared'
import { useEffect, useMemo, useState } from 'react'

import type { ClientImportRegistry } from '../../utilities/clientImportRegistry.js'

import { evaluateConditions } from '../evaluateConditions.js'

type ConditionFn = (data: unknown, siblingData: unknown, ctx: ConditionContext) => boolean

type ConditionContext = {
  blockData: unknown
  operation: 'create' | 'update' | undefined
  user: unknown
}

export type UseClientConditionVisibilityArgs = {
  blockData?: unknown
  data: Record<string, unknown>
  formState: FormState
  operation: 'create' | 'update' | undefined
  refs: ClientConfig['adminConditionRefs']
  registry: ClientImportRegistry | null
  user: unknown
}

/**
 * Pre-resolves admin.condition refs at mount via the client import registry, then
 * recomputes a visibility map on every form-state change. Returned map is fed into
 * `<VisibilityMapProvider>` so descendants can opt into client-side visibility.
 *
 * Inline conditions (already filtered server-side via the `<inline>` marker) are
 * absent from `refs`. Refs that fail to resolve are skipped with a warning.
 */
export function useClientConditionVisibility(
  args: UseClientConditionVisibilityArgs,
): Map<string, boolean> {
  const { blockData, data, operation, refs, registry, user } = args

  const [resolved, setResolved] = useState<Map<string, ConditionFn>>(() => new Map())

  useEffect(() => {
    if (!registry || !refs || refs.length === 0) {
      return
    }
    let cancelled = false
    const results = new Map<string, ConditionFn>()
    Promise.all(
      refs.map(async ({ fieldPath, ref }) => {
        const parsed = parsePayloadComponent(ref as Parameters<typeof parsePayloadComponent>[0])
        if (!parsed) {
          // `<inline>` refs are filtered server-side; reaching this branch means
          // a ref slipped through the filter. The field falls back to the
          // server-driven signal but the import-map likely has a stale entry.
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[payload] admin.condition ref could not be parsed', { fieldPath, ref })
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
                '[payload] admin.condition ref resolved to null/undefined; falling back to server condition',
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
                '[payload] admin.condition ref did not resolve to a function; falling back to server condition',
                { type: typeof fn, exportName, fieldPath, path: key, ref },
              )
            }
            return
          }
          results.set(fieldPath, fn as ConditionFn)
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(
              '[payload] admin.condition ref threw during resolution; falling back to server condition',
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
          console.warn('[payload] admin.condition registry resolution failed catastrophically', {
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
      return new Map<string, boolean>()
    }
    const fields = Array.from(resolved.entries(), ([path, condition]) => ({
      condition,
      path,
    }))
    return evaluateConditions({
      context: { blockData, operation, user },
      data,
      fields,
    })
    // formState is the formal trigger (data is derived from it via reduceFieldsToValues
    // in the caller). resolved changes only when the import map changes.
  }, [blockData, data, operation, resolved, user])
}
