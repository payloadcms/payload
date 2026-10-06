import type { WithServerSidePropsComponent } from 'payload'

import { isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

export const WithServerSideProps: WithServerSidePropsComponent = ({
  Component,
  serverOnlyProps,
  ...rest
}) => {
  if (Component) {
    const WithServerSideProps: React.FC = (passedProps) => {
      const propsWithServerOnlyProps = {
        ...passedProps,
        ...(isReactServerComponentOrFunction(Component) ? (serverOnlyProps ?? {}) : {}),
      }

      return <Component {...propsWithServerOnlyProps} />
    }

    return WithServerSideProps(rest)
  }

  return null
}
