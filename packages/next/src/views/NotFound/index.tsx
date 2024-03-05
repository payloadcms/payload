'use client'
import { Button, Gutter, useConfig, useStepNav, useTranslation } from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'

import { initPage } from '../../utilities/initPage.js'
import { NotFoundClient } from './index.client.js'

export const NotFoundView = async ({
  config: configPromise,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string | string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}) => {
  const config = await configPromise

  const initPageResult = await initPage({
    config,
    route: '',
    searchParams,
  })

  return (
    <DefaultTemplate
      config={initPageResult.req.payload.config}
      i18n={initPageResult.req.i18n}
      permissions={initPageResult.permissions}
      user={initPageResult.req.user}
    >
      {/* <Meta
        description={t('general:pageNotFound')}
        keywords={`404 ${t('general:notFound')}`}
        title={t('general:notFound')}
      /> */}
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
