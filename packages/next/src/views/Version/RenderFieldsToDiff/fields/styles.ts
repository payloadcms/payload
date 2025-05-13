import type { ReactDiffViewerStylesOverride } from 'react-diff-viewer-continued'

export const diffStyles: ReactDiffViewerStylesOverride = {
  diffContainer: {
    minWidth: 'unset',
  },
  variables: {
    dark: {
      addedBackground: 'var(--theme-success-900)',
      addedColor: 'var(--theme-success-100)',
      diffViewerBackground: 'transparent',
      diffViewerColor: 'var(--theme-text)',
      emptyLineBackground: 'var(--theme-elevation-50)',
      removedBackground: 'var(--theme-error-900)',
      removedColor: 'var(--theme-error-100)',
      wordAddedBackground: 'var(--theme-success-800)',
      wordRemovedBackground: 'var(--theme-error-800)',
    },
    light: {
      addedBackground: 'var(--theme-success-100)',
      addedColor: 'var(--theme-success-900)',
      diffViewerBackground: 'transparent',
      diffViewerColor: 'var(--theme-text)',
      emptyLineBackground: 'var(--theme-elevation-50)',
      removedBackground: 'var(--theme-error-100)',
      removedColor: 'var(--theme-error-900)',
      wordAddedBackground: 'var(--theme-success-200)',
      wordRemovedBackground: 'var(--theme-error-200)',
    },
  },
  wordAdded: {
    color: 'var(--theme-success-600)',
  },
  wordRemoved: {
    color: 'var(--theme-error-600)',
    textDecorationLine: 'line-through',
  },
}
