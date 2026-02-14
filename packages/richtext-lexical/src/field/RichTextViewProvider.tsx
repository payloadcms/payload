'use client'
import { useControllableState } from '@payloadcms/ui'
import React, { createContext, use, useMemo } from 'react'

import type { LexicalEditorNodeMap, LexicalEditorViewMap } from '../types.js'

/**
 * Context for managing richtext editor view state and inheritance.
 */
type RichTextViewContextType = {
  /**
   * The currently active view name (e.g., 'default', 'frontend', 'debug').
   */
  currentView: string
  /**
   * The resolved node map for the current view, containing rendering overrides for each node type.
   */
  currentViewMap?: LexicalEditorNodeMap
  /**
   * True if the current view was explicitly set (via prop) by this provider or an ancestor.
   * Used to distinguish intentional view settings from automatic defaults.
   */
  hasExplicitCurrentView?: boolean
  /**
   * True if this provider inherited its view from a parent provider.
   * When true, the ViewSelector is hidden because the view is controlled by an ancestor.
   */
  hasInheritedViews?: boolean
  /**
   * If true, nested richtext editors will inherit this provider's currentView and views.
   */
  inheritable?: boolean
  /**
   * Function to programmatically change the current view.
   */
  setCurrentView: (view: string) => void
  /**
   * Map of all available views for this editor. Each key is a view name, each value contains
   * admin config, node overrides, and lexical config for that view.
   */
  views?: LexicalEditorViewMap
}

const RichTextViewContext = createContext<RichTextViewContextType>({
  currentView: 'default',
  inheritable: false,
  setCurrentView: () => {},
})

/**
 * Provider for managing richtext editor view state and its inheritance.
 *
 * Handles two key scenarios:
 * 1. **Explicit view setting**: Wrap with `currentView` and `inheritable={true}` to force nested editors to a specific view
 * 2. **View map inheritance**: Nested editors inherit `views` from parents, allowing view switching across the hierarchy
 *
 * When a nested editor inherits from a parent, its ViewSelector is hidden because the view is controlled by an ancestor.
 *
 * @example
 * Force all nested richtext editors to use "frontend" view:
 * ```tsx
 * <RichTextViewProvider currentView="frontend" inheritable={true}>
 *   <MyForm /> {/* All richtext fields inside will use "frontend" view }
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

  // Track if this provider explicitly sets currentView (not just using the default)
  const hasOwnExplicitView = args.currentView !== undefined

  const hasInheritedViews =
    parentContext.inheritable && Boolean(parentContext.hasExplicitCurrentView)

  // This provider has explicit currentView if it sets one OR inherits one from parent
  const hasExplicitCurrentView =
    hasOwnExplicitView ||
    (parentContext.inheritable && Boolean(parentContext.hasExplicitCurrentView))

  const {
    children,
    currentView: currentViewFromProps,
    inheritable,
    views,
  } = {
    children: args.children,
    // Only inherit currentView if parent has an explicit one
    currentView:
      parentContext.inheritable && parentContext.hasExplicitCurrentView
        ? parentContext.currentView
        : args.currentView,
    // Propagate inheritable flag through the hierarchy
    inheritable: parentContext.inheritable || args.inheritable,
    // Only inherit views if parent has a views map
    views: parentContext.inheritable && parentContext.views ? parentContext.views : args.views,
  }

  const [currentView, setCurrentView] = useControllableState(currentViewFromProps, 'default')

  const value = useMemo(() => {
    const currentViewMap = views ? views[currentView] || views.default : undefined
    return {
      currentView,
      currentViewMap,
      hasExplicitCurrentView,
      hasInheritedViews,
      inheritable,
      setCurrentView,
      views,
    }
  }, [currentView, inheritable, hasExplicitCurrentView, hasInheritedViews, setCurrentView, views])

  return <RichTextViewContext value={value}>{children}</RichTextViewContext>
}

/**
 * Access the current richtext editor view context.
 *
 * Returns the active view name, node overrides, inheritance state, and a function to switch views.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentView, currentViewMap, hasInheritedViews, setCurrentView } = useRichTextView()
 *
 *   return (
 *     <div>
 *       <p>Active view: {currentView}</p>
 *       {hasInheritedViews && <p>View inherited from parent</p>}
 *       {currentViewMap?.heading && <p>Custom heading renderer active</p>}
 *       <button onClick={() => setCurrentView('frontend')}>Switch to frontend</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRichTextView(): RichTextViewContextType {
  return use(RichTextViewContext)
}
