import React from 'react'

import { useConfig } from '../Config'

const NestProviders = ({ children, providers }) => {
  const Component = providers[0]
  if (providers.length > 1) {
    return (
      <Component>
        <NestProviders providers={providers.slice(1)}>{children}</NestProviders>
      </Component>
    )
  }
  return <Component>{children}</Component>
}

export const CustomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useConfig()

  const {
    admin: {
      components: { providers },
    },
  } = config

  if (Array.isArray(providers) && providers.length > 0) {
    return <NestProviders providers={providers}>{children}</NestProviders>
  }

  return <React.Fragment>{children}</React.Fragment>
}
