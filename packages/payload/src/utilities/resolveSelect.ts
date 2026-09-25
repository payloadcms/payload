import type { PayloadRequest, SelectFn, SelectFnOperation, SelectType } from '../types/index.js'

/**
 * Invoke an entity-level `select` config (always a function form) and return
 * the resolved select to pass into `sanitizeSelect`.
 *
 * - No config → caller's `select` unchanged.
 * - Function returning `SelectType` → replaces the caller's `select`.
 * - Function returning `undefined` → caller's `select` unchanged.
 */
export const resolveSelect = <TSelect extends SelectType = SelectType>({
  config,
  operation,
  req,
  select,
}: {
  config?: SelectFn<TSelect>
  operation: SelectFnOperation
  req: PayloadRequest
  select?: SelectType
}): SelectType | undefined => {
  if (typeof config !== 'function') {
    return select
  }

  return config({ operation, req, select }) ?? select
}
