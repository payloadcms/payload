import React from 'react'

type EventHandler<
  TEvent extends React.KeyboardEvent | React.MouseEvent = React.KeyboardEvent | React.MouseEvent,
> = (event: TEvent) => void

interface UseActionDelegationOptions<
  TActions extends Record<string, EventHandler<React.KeyboardEvent | React.MouseEvent>>,
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
 * Provides a generic way to handle events on elements marked with a specific data attribute,
 * while ensuring user-provided interactive elements work independently.
 *
 * @param options - Configuration options
 * @returns Object with event handlers, dataAttributeName, and actionNames (with full TS inference)
 *
 * @example
 * ```tsx
 * const { handleClick, handleKeyDown, actionNames } = useActionDelegation({
 *   dataAttributeName: 'data-row-action',
 *   actions: {
 *     selectRow: (event) => handleSelect(),
 *     toggleExpand: (event) => handleToggle(),
 *   }
 * })
 *
 * <div onClick={handleClick} onKeyDown={handleKeyDown}>
 *   <div data-row-action={actionNames.selectRow}>Click or press key</div>
 *   <button data-row-action={actionNames.toggleExpand}>Toggle</button>
 * </div>
 * ```
 */
export function useActionDelegation<
  TActions extends Record<string, EventHandler<React.KeyboardEvent | React.MouseEvent>>,
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

  // Generic handler that works with any event type
  const createHandler = React.useCallback(
    (event: React.KeyboardEvent | React.MouseEvent) => {
      // Early return if disabled
      if (disabled) {
        return
      }

      const target = event.target as HTMLElement

      // Check if event came from an interactive element (but not the row wrapper)
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

  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      createHandler(event)
    },
    [createHandler],
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Only handle Enter and Space on interactive elements
      if (event.code === 'Enter' || event.code === 'Space') {
        createHandler(event)
      }
    },
    [createHandler],
  )

  return {
    actionNames,
    dataAttributeName,
    handleClick,
    handleKeyDown,
  }
}
