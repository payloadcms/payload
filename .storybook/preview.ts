import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'

// Import Payload styles
import '../packages/ui/src/scss/app.scss'

// Create a mock Next.js AppRouterContext
const MockAppRouterContext = React.createContext({
  tree: {},
  focusAndScrollRef: { apply: false },
  changeByServerResponse: () => {},
  nextUrl: null,
})

// Mock router provider component
const MockRouterProvider = ({ children }) => {
  const mockRouter = {
    push: (url) => console.log('Mock router.push:', url),
    replace: (url) => console.log('Mock router.replace:', url),
    refresh: () => console.log('Mock router.refresh'),
    back: () => console.log('Mock router.back'),
    forward: () => console.log('Mock router.forward'),
    prefetch: () => Promise.resolve(),
  }
  
  return React.createElement(MockAppRouterContext.Provider, {
    value: {
      tree: {},
      focusAndScrollRef: { apply: false },
      changeByServerResponse: () => {},
      nextUrl: null,
    }
  }, children)
}

// Global decorator to provide router context
const withMockRouter = (Story) => {
  return React.createElement(MockRouterProvider, {}, React.createElement(Story))
}

const preview: Preview = {
  decorators: [withMockRouter],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'payload-light',
      values: [
        {
          name: 'payload-light',
          value: '#fafafa',
        },
        {
          name: 'payload-dark', 
          value: '#1a1a1a',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
      ],
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/mock-path',
        query: {},
      },
    },
  },
}

export default preview