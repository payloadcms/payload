import type { ServerProps } from 'payload'

import React, { Fragment } from 'react'

export const CustomProviderServer: React.FC<{ children: React.ReactNode } & ServerProps> = ({
  children,
  payload,
}) => {
  return (
    <Fragment>
      <div className="custom-provider-server" style={{ display: 'none' }}>
        {`This is a custom provider with payload: ${Boolean(payload)}`}
      </div>
      {children}
    </Fragment>
  )
}
