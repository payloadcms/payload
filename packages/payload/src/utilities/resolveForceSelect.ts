import type { ForceSelect, ForceSelectFnArgs, SelectType } from '../types/index.js'

/**
 * Normalize a `forceSelect` config into a `SelectType`.
 * If `forceSelect` is a function it is invoked with the provided context.
 */
export const resolveForceSelect = <TSelect extends SelectType = SelectType>({
  args,
  forceSelect,
}: {
  args: ForceSelectFnArgs
  forceSelect?: ForceSelect<TSelect>
}): TSelect | undefined => {
  if (typeof forceSelect === 'function') {
    return forceSelect(args)
  }

  return forceSelect
}
