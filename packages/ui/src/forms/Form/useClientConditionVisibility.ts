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
    // Phase 14: expand wildcard fieldPaths (e.g. `rows.*.dependentRowField`)
    // into concrete row paths against the live document data. WatchCondition
    // looks up by concrete path (`rows.0.dependentRowField`); without this
    // step the visibility map carries only wildcard keys, the lookup misses,
    // and the field falls back to the server-driven `passesCondition` which
    // lags one keystroke behind.
    const fields: Array<{
      condition: ConditionFn
      path: string
      siblingData?: unknown
    }> = []
    for (const [fieldPath, condition] of resolved) {
      if (!fieldPath.includes('.*.')) {
        fields.push({ condition, path: fieldPath })
        continue
      }
      for (const expanded of expandWildcardPath(fieldPath, data)) {
        fields.push({
          condition,
          path: expanded.concretePath,
          siblingData: expanded.siblingData,
        })
      }
    }
    return evaluateConditions({
      context: { blockData, operation, user },
      data,
      fields,
    })
    // formState is the formal trigger (data is derived from it via reduceFieldsToValues
    // in the caller). resolved changes only when the import map changes.
  }, [blockData, data, operation, resolved, user])
}

type ExpandedPath = {
  concretePath: string
  /**
   * The data slice immediately containing the leaf field — the row object for
   * an array-row field, or the parent row when nested deeper. Forwarded to
   * `evaluateConditions` so sibling-scoped conditions read the right row.
   */
  siblingData: unknown
}

/**
 * Walks `data` along `fieldPath`, expanding each `*` segment into one entry
 * per array index it encounters. Returns concrete paths plus the sibling data
 * slice the leaf field belongs to. Non-array values at a wildcard segment are
 * silently skipped — keeps the helper safe against partial form state.
 */
function expandWildcardPath(fieldPath: string, data: unknown): ExpandedPath[] {
  const segments = fieldPath.split('.')
  const out: ExpandedPath[] = []
  walk(segments, 0, data, [], out)
  return out
}

function walk(
  segments: string[],
  index: number,
  current: unknown,
  resolvedSegments: string[],
  out: ExpandedPath[],
): void {
  if (current == null) {
    return
  }
  if (index === segments.length - 1) {
    out.push({
      concretePath: [...resolvedSegments, segments[index]].join('.'),
      siblingData: current,
    })
    return
  }
  const segment = segments[index]
  if (segment === '*') {
    if (!Array.isArray(current)) {
      return
    }
    for (let i = 0; i < current.length; i++) {
      walk(segments, index + 1, current[i], [...resolvedSegments, String(i)], out)
    }
    return
  }
  if (typeof current !== 'object') {
    return
  }
  walk(
    segments,
    index + 1,
    (current as Record<string, unknown>)[segment],
    [...resolvedSegments, segment],
    out,
  )
}
