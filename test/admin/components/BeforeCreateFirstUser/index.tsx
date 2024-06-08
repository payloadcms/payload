'use client'

import type { SanitizedConfig } from 'payload/types'

import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React from 'react'

export const BeforeCreateFirstUser: SanitizedConfig['admin']['components']['beforeCreateFirstUser'][0] =
  () => {
    const translation = useTranslation()

    return (
      <div>
        <h3>{translation.t('general:welcome')}</h3>
        <p>
          This demo is a set up to configure Payload for the develop and testing of features. To see
          a product demo of a Payload project please visit:{' '}
          <a href="https://demo.payloadcms.com" rel="noreferrer" target="_blank">
            demo.payloadcms.com
          </a>
          .
        </p>
      </div>
    )
  }
