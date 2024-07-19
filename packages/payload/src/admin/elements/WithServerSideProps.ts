import type React from 'react'

import type { PayloadComponent, ServerProps } from '../../config/types.js'

export type WithServerSidePropsComponentProps = {
  [key: string]: any
  Component: PayloadComponent
  serverOnlyProps: ServerProps
}

export type WithServerSidePropsComponent = React.FC<WithServerSidePropsComponentProps>
