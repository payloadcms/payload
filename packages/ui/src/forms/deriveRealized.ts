import type { ComponentSlot, FormState } from 'payload'

/**
 * Map between the lowercase `ComponentSlot` values used by the component
 * index (e.g. `afterInput`) and the Pascal-cased keys used in the form
 * state's `customComponents` bag (e.g. `AfterInput`). The two namespaces
 * exist for historical reasons; this helper is the single source of truth
 * for translating between them.
 */
export const SLOT_TO_CUSTOM_COMPONENT_KEY: Record<ComponentSlot, string> = {
  afterInput: 'AfterInput',
  beforeInput: 'BeforeInput',
  Description: 'Description',
  Error: 'Error',
  Field: 'Field',
  Label: 'Label',
  RowLabel: 'RowLabel',
}

/**
 * Reverse of `SLOT_TO_CUSTOM_COMPONENT_KEY` — maps a `customComponents` bag
 * key back to the slot enum used by the component index. Used when
 * deriving the "realized" set from existing form state.
 */
export const CUSTOM_COMPONENT_KEY_TO_SLOT: Record<string, ComponentSlot> = Object.fromEntries(
  Object.entries(SLOT_TO_CUSTOM_COMPONENT_KEY).map(([slot, key]) => [key, slot as ComponentSlot]),
) as Record<string, ComponentSlot>

/**
 * Builds a "realized" set of `${path}|${slot}` keys describing every
 * component already rendered into the form state. Consumed by `decideCall`
 * to skip re-rendering targets that the initial paint or a prior dispatch
 * has already supplied.
 *
 * The helper is intentionally stateless and reads only from
 * `customComponents`, the same bag the existing dispatch path populates —
 * no new field-level concept introduced.
 */
export function deriveRealizedFromFormState(formState: FormState | null | undefined): Set<string> {
  const realized = new Set<string>()
  if (!formState) {
    return realized
  }
  for (const [fieldPath, fieldState] of Object.entries(formState)) {
    const slots = fieldState?.customComponents
    if (!slots) {
      continue
    }
    for (const customKey of Object.keys(slots)) {
      const value = slots[customKey]
      if (value == null) {
        continue
      }
      const slot = CUSTOM_COMPONENT_KEY_TO_SLOT[customKey]
      if (!slot) {
        continue
      }
      realized.add(`${fieldPath}|${slot}`)
    }
  }
  return realized
}
