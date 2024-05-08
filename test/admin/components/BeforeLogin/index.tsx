import type { SanitizedConfig } from 'payload/types'

import React from 'react'

export const BeforeLogin: SanitizedConfig['admin']['components']['beforeLogin'][0] = () => {
  return (
    <div>
      <h3>hrth</h3>
      <p>
        This demo is a set up to configure Payload for the develop and testing of features. To see a
        product demo of a Payload project please visit:{' '}
        <a href="https://demo.payloadcms.com" rel="noreferrer" target="_blank">
          demo.payloadcms.com
        </a>
        .
      </p>
    </div>
  )
}
