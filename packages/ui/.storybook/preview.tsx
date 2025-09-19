import type { Preview } from '@storybook/react-vite'
import type {
  ClientConfig,
  SanitizedPermissions,
  ServerFunctionClientArgs,
  TypedUser,
} from 'payload'

import React from 'react'

// Import global styles for all stories
import '../src/scss/app.scss'

// Mock fetch API for Storybook to prevent API calls
// Apply the mock immediately and globally
const originalFetch = globalThis.fetch || window.fetch

const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url.toString()

  console.log('Mock fetch called with URL:', urlString) // Debug log

  // Mock user API endpoint - check for the pattern that matches our config
  if (urlString.includes('/api/users/me')) {
    console.log('Mocking user API call')
    return new Response(
      JSON.stringify({
        user: {
          id: '1',
          email: 'storybook@example.com',
          collection: 'users',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        token: 'mock-token',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  // Mock permissions API endpoint
  if (urlString.includes('/api/access')) {
    console.log('Mocking permissions API call')
    return new Response(
      JSON.stringify({
        canAccessAdmin: true,
        collections: {},
        globals: {},
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  // Mock refresh token endpoint
  if (urlString.includes('/api/users/refresh-token')) {
    console.log('Mocking refresh token API call')
    return new Response(
      JSON.stringify({
        user: {
          id: '1',
          email: 'storybook@example.com',
          collection: 'users',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        token: 'mock-refreshed-token',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  // For all other requests, return a 404
  console.log('Returning 404 for unmocked URL:', urlString)
  return new Response('Not Found', { status: 404 })
}

// Apply the mock globally
if (typeof globalThis !== 'undefined') {
  globalThis.fetch = mockFetch
}
if (typeof window !== 'undefined') {
  window.fetch = mockFetch
}

// Import PayloadCMS providers
import { RootProvider } from '../src/providers/Root/index.js'
import config from './payload.config.js'

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
  decorators: [
    withTheme,
    (Story) => (
      <RootProvider
        config={config}
        dateFNSKey={'hr'}
        fallbackLang={'en'}
        languageCode={'en'}
        languageOptions={[{ label: 'English', value: 'en' }]}
        permissions={{
          canAccessAdmin: true,
          collections: {
            posts: {
              create: true,
              read: true,
              update: true,
              delete: true,
              fields: {},
            },
            categories: {
              create: true,
              read: true,
              update: true,
              delete: true,
              fields: {},
            },
          },
          globals: {},
        }}
        serverFunction={function (args: ServerFunctionClientArgs): Promise<unknown> | unknown {
          console.log('serverFunction called')
          // Mock server function for Storybook
          return Promise.resolve({})
        }}
        theme={'light'}
        translations={{
          general: {
            loading: 'Loading',
          },
          authentication: {
            youAreInactive:
              "You haven't been active in a little while and will shortly be automatically logged out for your own security. Would you like to stay logged in?",
            stayLoggedIn: 'Stay logged in',
            logOut: 'Log out',
          },
          fields: {
            addNew: 'Add new',
          },
        }}
        user={{
          id: '1',
          email: 'storybook@example.com',
          collection: 'users',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }}
      >
        <Story />
      </RootProvider>
    ),
  ],
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
