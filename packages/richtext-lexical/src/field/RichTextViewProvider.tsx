'use client'
import { useControllableState } from '@payloadcms/ui'
import React, { createContext, use, useMemo } from 'react'

import type { LexicalEditorNodeMap, LexicalEditorViewMap } from '../types.js'

/**
 * Context type for rich text view management.
 */
type RichTextViewContextType = {
  /**
   * The name of the currently active view (e.g., 'default', 'frontend', 'debug')
   */
  currentView: string
  /**
   * The node map for the currently active view, containing rendering overrides for each node type.
   * This is the resolved view from the views map based on currentView.
   */
  currentViewMap?: LexicalEditorNodeMap
  hasInheritedView?: boolean
  /**
   * If true, the current view will be inherited by nested richtext editors.
   */
  inheritable?: boolean
  /**
   * Function to change the current view.
   */
  setCurrentView: (view: string) => void
  /**
   * The complete map of all available views for this field.
   */
  views?: LexicalEditorViewMap
}

const RichTextViewContext = createContext<RichTextViewContextType>({
  currentView: 'default',
  inheritable: false,
  setCurrentView: () => {},
})

/**
 * Provider component for rich text view context.
 *
 * This provider manages the current view state internally and makes it accessible to child components
 * via the useRichTextView hook. It automatically resolves the current view's node map
 * based on the active view name.
 *
 * @example
 * ```tsx
 * <RichTextViewProvider
 *   currentView="frontend"
 *   views={myViews}
 * >
 *   <MyEditor />
 * </RichTextViewProvider>
 * ```
 */
export const RichTextViewProvider: React.FC<{
  children: React.ReactNode
  currentView?: string
  inheritable?: boolean
  views?: LexicalEditorViewMap
}> = (args) => {
  const parentContext = useRichTextView()

  const {
    children,
    currentView: currentViewFromProps,
    inheritable,
    views,
  } = parentContext.inheritable
    ? {
        ...parentContext,
        ...args,
      }
    : args

  const [currentView, setCurrentView] = useControllableState(currentViewFromProps, 'default')

  const value = useMemo(() => {
    const currentViewMap = views ? views[currentView] || views.default : undefined
    return {
      currentView,
      currentViewMap,
      hasInheritedView: parentContext.inheritable,
      inheritable,
      setCurrentView,
      views,
    }
  }, [currentView, inheritable, parentContext.inheritable, setCurrentView, views])

  return <RichTextViewContext value={value}>{children}</RichTextViewContext>
}

/**
 * Hook to access the current rich text view context.
 *
 * Use this hook to access the currently active view and its node map,
 * or to programmatically switch between views.
 *
 * @returns An object containing:
 * - `currentView`: The name of the active view
 * - `currentViewMap`: The node overrides for the current view
 * - `setCurrentView`: Function to change views
 * - `views`: All available views
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentView, currentViewMap, setCurrentView } = useRichTextView()
 *
 *   return (
 *     <div>
 *       <p>Current view: {currentView}</p>
 *       {currentViewMap?.heading && <p>Heading overrides are active</p>}
 *       <button onClick={() => setCurrentView('frontend')}>
 *         Switch to frontend view
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRichTextView(): RichTextViewContextType {
  return use(RichTextViewContext)
}
