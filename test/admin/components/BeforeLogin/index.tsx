'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

export const BeforeLogin: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['beforeLogin'][0]
> = () => {
  const translation = useTranslation()

  return (
    <div>
      <h3>{translation.t('general:welcome')}</h3>
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
