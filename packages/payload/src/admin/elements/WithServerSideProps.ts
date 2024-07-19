import type React from 'react'

import type { ServerProps } from '../../config/types.js'

export type WithServerSidePropsComponentProps = {
  [key: string]: any
  Component: React.ComponentType<any>
  serverOnlyProps: ServerProps
}

export type WithServerSidePropsComponent = React.FC<WithServerSidePropsComponentProps>
