import React from 'react'

interface UseActionDelegationOptions<
  TActions extends Record<string, (event: React.MouseEvent) => void>,
> {
  /**
   * Object mapping action names to handler functions.
   * The keys will be returned as actionNames with full TypeScript inference.
   */
  actions: TActions
  /**
   * Data attribute name to use for action identification.
   * @example 'data-action', 'data-row-action', 'data-cell-action'
   */
  dataAttributeName: string
  /**
   * Whether the delegation is disabled. When true, no actions will be triggered.
   * @default false
   */
  disabled?: boolean
  /**
   * Selector for interactive elements that should be ignored when they don't have the action attribute.
   * @default 'a, button, input, textarea, select'
   */
  interactiveSelector?: string
}

/**
 * Hook for handling event delegation with data attributes.
 * Provides a generic way to handle clicks on elements marked with a specific data attribute,
 * while ensuring user-provided interactive elements work independently.
 *
 * @param options - Configuration options
 * @returns Object with handleClick function, dataAttributeName, and actionNames (with full TS inference)
 *
 * @example
 * ```tsx
 * const { handleClick, actionNames } = useActionDelegation({
 *   dataAttributeName: 'data-row-action',
 *   actions: {
 *     'select-row': (event) => handleSelect(),
 *     'toggle-expand': (event) => handleToggle(),
 *   }
 * })
 *
 * // Use with full intellisense:
 * <div data-row-action={actionNames['select-row']}>...</div>
 * ```
 */
export function useActionDelegation<
  TActions extends Record<string, (event: React.MouseEvent) => void>,
>({
  actions,
  dataAttributeName,
  disabled = false,
  interactiveSelector = 'a, button, input, textarea, select',
}: UseActionDelegationOptions<TActions>) {
  // Create actionNames object with same keys as actions
  const actionNames = React.useMemo(
    () =>
      Object.keys(actions).reduce(
        (acc, key) => {
          acc[key as keyof TActions] = key
          return acc
        },
        {} as { [K in keyof TActions]: K },
      ),
    [actions],
  )

  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      // Early return if disabled
      if (disabled) {
        return
      }

      const target = event.target as HTMLElement

      // Check if click came from an interactive element (but not the row wrapper)
      const interactiveElement = target.closest(interactiveSelector)

      if (interactiveElement) {
        // If interactive element doesn't have action attribute, it's user content - ignore
        if (!interactiveElement.hasAttribute(dataAttributeName)) {
          return
        }
      }

      // Find the nearest element with action attribute
      const actionElement = target.closest(`[${dataAttributeName}]`)
      if (!actionElement) {
        return // No action found, ignore
      }

      const action = actionElement.getAttribute(dataAttributeName)
      if (action && action in actions) {
        actions[action as keyof TActions](event)
      }
    },
    [dataAttributeName, actions, disabled, interactiveSelector],
  )

  return {
    actionNames,
    dataAttributeName,
    handleClick,
  }
}
