import type { Preview } from '@storybook/react-vite'
import React from 'react'

// Import global styles for all stories
import '../src/scss/app.scss'

// Theme wrapper component
const ThemeWrapper: React.FC<{ children: React.ReactNode; theme: string }> = ({
  children,
  theme,
}) => {
  React.useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark')
    } else {
      html.removeAttribute('data-theme')
    }
  }, [theme])

  return React.createElement(React.Fragment, null, children)
}

// Theme decorator that applies the selected theme
const withTheme = (StoryFn: any, context: any) => {
  // Get theme from story parameters first, then fallback to globals
  const theme = context.parameters.theme || context.globals.theme || 'light'

  return React.createElement(ThemeWrapper, { theme, children: React.createElement(StoryFn) })
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [withTheme],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        // The icon for the toolbar item
        icon: 'circlehollow',
        // Array of options
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        // Property that specifies if the name of the item will be displayed
        showName: true,
      },
    },
  },
}

export default preview
