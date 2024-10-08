import React from 'react'
import { useTranslation } from 'react-i18next'

const BeforeLogin = () => {
  const { t } = useTranslation()
  return (
    <div>
      <h3>{t('general:welcome')}</h3>
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

export default BeforeLogin
