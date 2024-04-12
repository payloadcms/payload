import type { WithServerSideProps as WithServerSidePropsType } from 'payload/types'

import { isReactServerComponent } from 'payload/utilities'
import React from 'react'

export const WithServerSideProps: WithServerSidePropsType = ({ Component, payload, ...rest }) => {
  if (Component) {
    const WithServerSideProps: React.FC<any> = (passedProps) => {
      const propsWithPayload = {
        ...passedProps,
        ...(isReactServerComponent(Component) ? { payload } : {}),
      }

      return <Component {...propsWithPayload} />
    }

    return <WithServerSideProps {...rest} />
  }

  return null
}
