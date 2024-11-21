import type { ServerProps } from 'payload'

import React, { Fragment } from 'react'

export const CustomProviderServer: React.FC<{ children: React.ReactNode } & ServerProps> = ({
  children,
  payload,
}) => {
  return (
    <Fragment>
      <div className="custom-provider-server" style={{ display: 'none' }}>
        {`Custom server provider has payload: ${Boolean(payload)}`}
      </div>
      {children}
    </Fragment>
  )
}
