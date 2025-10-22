'use client'
import type { EditorThemeClasses } from 'lexical'

import React, { createContext, use, useMemo } from 'react'

import type { LexicalEditorViewMap } from '../types.js'

/**
 * Context type for rich text view management.
 */
type RichTextViewContextType = {
  /**
   * The currently active view containing name, nodes, and theme.
   */
  currentView: {
    /**
     * The name of the currently active view (e.g., 'default', 'frontend', 'debug')
     */
    name: string
    /**
     * The editor theme for the currently active view. Defaults to the editor's configured theme.
     */
    theme: EditorThemeClasses
  } & Pick<LexicalEditorViewMap[string], 'nodes'>
  /**
   * Optional function to change the current view by name. Only available in contexts where view switching is enabled (e.g., admin panel).
   */
  setCurrentView?: (viewName: string) => void
  /**
   * The complete map of all available views for this field.
   */
  views?: LexicalEditorViewMap
}

const RichTextViewContext = createContext<null | RichTextViewContextType>(null)

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
 *   currentViewName="frontend"
 *   defaultTheme={editorConfig.lexical.theme}
 *   setCurrentView={setView}
 *   views={myViews}
 * >
 *   <MyEditor />
 * </RichTextViewProvider>
 * ```
 */
export const RichTextViewProvider: React.FC<{
  children: React.ReactNode
  currentViewName?: string
  defaultTheme: EditorThemeClasses
  setCurrentView?: (viewName: string) => void
  views?: LexicalEditorViewMap
}> = ({ children, currentViewName = 'default', defaultTheme, setCurrentView, views }) => {
  const currentView = useMemo(() => {
    const viewDefinition = views?.[currentViewName] || views?.default

    return {
      name: currentViewName,
      nodes: viewDefinition?.nodes,
      theme: viewDefinition?.theme || defaultTheme,
    } as RichTextViewContextType['currentView']
  }, [views, currentViewName, defaultTheme])

  const value = useMemo(
    () => ({
      currentView,
      setCurrentView,
      views,
    }),
    [currentView, setCurrentView, views],
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
 * - `currentView`: Object with `name`, `nodes`, and `theme` properties
 * - `setCurrentView`: Function to change views by name (if available)
 * - `views`: All available views
 *
 * @throws Error if used outside of a RichTextViewProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentView, setCurrentView } = useRichTextView()
 *
 *   return (
 *     <div>
 *       <p>Current view: {currentView.name}</p>
 *       {currentView.nodes?.heading && <p>Heading overrides are active</p>}
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
