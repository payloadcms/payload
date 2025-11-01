import React from 'react'

// Mock providers for Payload components that require context

export const MockConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const mockConfig = {
    admin: {
      components: {},
      user: 'users',
    },
    localization: {
      locales: ['en', 'es', 'fr'],
      defaultLocale: 'en',
    },
    collections: [
      {
        slug: 'pages',
        labels: { singular: 'Page', plural: 'Pages' },
      },
      {
        slug: 'users',
        labels: { singular: 'User', plural: 'Users' },
      },
    ],
  }

  return (
    <div data-mock-config={JSON.stringify(mockConfig)}>
      {children}
    </div>
  )
}

export const MockLocaleProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-mock-locale="en">
      {children}
    </div>
  )
}

export const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-theme="auto" className="payload-admin">
      {children}
    </div>
  )
}

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockUser = {
    id: '1',
    email: 'demo@payloadcms.com',
    collection: 'users',
  }

  return (
    <div data-mock-user={JSON.stringify(mockUser)}>
      {children}
    </div>
  )
}

// Combined mock provider wrapper
export const PayloadMockProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockConfigProvider>
      <MockLocaleProvider>
        <MockThemeProvider>
          <MockAuthProvider>
            {children}
          </MockAuthProvider>
        </MockThemeProvider>
      </MockLocaleProvider>
    </MockConfigProvider>
  )
}