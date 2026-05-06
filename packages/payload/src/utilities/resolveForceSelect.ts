import type {
  ForceSelect,
  ForceSelectOperation,
  PayloadRequest,
  SelectType,
} from '../types/index.js'

/**
 * Normalize a `forceSelect` config into a `SelectType`.
 * If `forceSelect` is a function it is invoked with the provided context.
 */
export const resolveForceSelect = <TSelect extends SelectType = SelectType>({
  forceSelect,
  operation,
  req,
}: {
  forceSelect?: ForceSelect<TSelect>
  operation: ForceSelectOperation
  req: PayloadRequest
}): TSelect | undefined => {
  if (typeof forceSelect === 'function') {
    return forceSelect({ operation, req })
  }

  return forceSelect
}
