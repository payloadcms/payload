'use client'
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
  /**
   * Optional function to change the current view. Only available in contexts where view switching is enabled (e.g., admin panel).
   */
  setCurrentView?: (view: string) => void
  /**
   * The complete map of all available views for this field.
   */
  views?: LexicalEditorViewMap
}

const RichTextViewContext = createContext<RichTextViewContextType>({
  currentView: 'default',
  currentViewMap: undefined,
  setCurrentView: undefined,
  views: undefined,
})

/**
 * Provider component for rich text view context.
 *
 * This provider manages the current view state and makes it accessible to child components
 * via the useRichTextView hook. It automatically resolves the current view's node map
 * based on the active view name.
 *
 * @example
 * ```tsx
 * <RichTextViewProvider
 *   currentView="frontend"
 *   setCurrentView={setView}
 *   views={myViews}
 * >
 *   <MyEditor />
 * </RichTextViewProvider>
 * ```
 */
export const RichTextViewProvider: React.FC<{
  children: React.ReactNode
  currentView?: string
  setCurrentView?: (view: string) => void
  views?: LexicalEditorViewMap
}> = ({ children, currentView = 'default', setCurrentView, views }) => {
  const currentViewMap = useMemo(() => {
    if (!views) {
      return undefined
    }
    return views[currentView] || views.default
  }, [views, currentView])

  const value = useMemo(
    () => ({
      currentView,
      currentViewMap,
      setCurrentView,
      views,
    }),
    [currentView, setCurrentView, currentViewMap, views],
  )

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
 * - `setCurrentView`: Function to change views (if available)
 * - `views`: All available views
 *
 * @throws Error if used outside of a RichTextViewProvider
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
 *       {setCurrentView && (
 *         <button onClick={() => setCurrentView('frontend')}>
 *           Switch to frontend view
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useRichTextView(): RichTextViewContextType {
  const context = use(RichTextViewContext)

  if (!context) {
    throw new Error('useRichTextView must be used within a RichTextViewProvider')
  }

  return context
}
