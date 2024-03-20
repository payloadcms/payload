'use client'
import { Button } from '@payloadcms/ui/elements/Button'
import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { useStepNav } from '@payloadcms/ui/elements/StepNav'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import LinkImport from 'next/link.js'
import React, { useEffect } from 'react'

import './index.scss'

const baseClass = 'not-found'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const NotFoundClient: React.FC<{
  marginTop?: 'large'
}> = (props) => {
  const { marginTop = 'large' } = props

  const { setStepNav } = useStepNav()
  const { t } = useTranslation()

  const {
    routes: { admin },
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
        <h1>{t('general:nothingFound')}</h1>
        <p>{t('general:sorryNotFound')}</p>
        <Button Link={Link} className={`${baseClass}__button`} el="link" to={`${admin}`}>
          {t('general:backToDashboard')}
        </Button>
      </Gutter>
    </div>
  )
}
