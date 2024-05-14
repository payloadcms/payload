import type { WithServerSideProps as WithServerSidePropsType } from 'payload/types'

import { isReactServerComponentOrFunction } from 'payload/utilities'
import React from 'react'

export const WithServerSideProps: WithServerSidePropsType = ({ Component, payload, ...rest }) => {
  if (Component) {
    const WithServerSideProps: React.FC = (passedProps) => {
      const propsWithPayload = {
        ...passedProps,
        ...(isReactServerComponentOrFunction(Component) ? { payload } : {}),
      }

      return <Component {...propsWithPayload} />
    }

    return <WithServerSideProps {...rest} />
  }

  return null
}
