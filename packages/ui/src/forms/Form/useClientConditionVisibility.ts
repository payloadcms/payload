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
            // the server-driven `passesCondition` signal that already gates
            // visibility. A future debug-mode hook can surface failures.
            return
          }
          const fn = (mod as Record<string, unknown>)[exportName]
          if (typeof fn !== 'function') {
            return
          }
          results.set(fieldPath, fn as ConditionFn)
        } catch {
          // Same failure mode as above: skip silently and let the server-driven
          // signal carry the field's visibility.
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
