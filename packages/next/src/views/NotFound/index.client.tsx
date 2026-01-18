'use client'
import { Button, Gutter, useConfig, useStepNav, useTranslation } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import './index.scss'

const baseClass = 'not-found'

export const NotFoundClient: React.FC<{
  marginTop?: 'large'
}> = (props) => {
  const { marginTop = 'large' } = props

  const { setStepNav } = useStepNav()
  const { t } = useTranslation()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  useEffect(() => {
    setStepNav([
      {
        label: t('general:notFound'),
      },
    ])
  }, [setStepNav, t])

  return (
    <div
      className={[baseClass, marginTop && `${baseClass}--margin-top-${marginTop}`]
        .filter(Boolean)
        .join(' ')}
    >
      <Gutter className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__content`}>
          <h1>{t('general:nothingFound')}</h1>
          <p>{t('general:sorryNotFound')}</p>
        </div>
        <Button className={`${baseClass}__button`} el="link" size="large" to={adminRoute}>
          {t('general:backToDashboard')}
        </Button>
      </Gutter>
    </div>
  )
}
