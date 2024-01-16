'use client'
import React from 'react'

import { Button, Gutter, useStepNav, useConfig, useTranslation } from '@payloadcms/ui'
// import Meta from '../../utilities/Meta'
import './index.scss'

const baseClass = 'not-found'

const NotFound: React.FC<{
  marginTop?: 'large'
}> = (props) => {
  const { marginTop } = props

  const { setStepNav } = useStepNav()
  const { t } = useTranslation()

  const {
    routes: { admin },
  } = useConfig()

  // useEffect(() => {
  //   setStepNav([
  //     {
  //       label: t('general:notFound'),
  //     },
  //   ])
  // }, [setStepNav, t])

  return (
    <div
      className={[baseClass, marginTop && `${baseClass}--margin-top-${marginTop}`]
        .filter(Boolean)
        .join(' ')}
    >
      {/* <Meta
        description={t('general:pageNotFound')}
        keywords={`404 ${t('general:notFound')}`}
        title={t('general:notFound')}
      /> */}
      <Gutter className={`${baseClass}__wrap`}>
        <h1>{t('general:nothingFound')}</h1>
        <p>{t('general:sorryNotFound')}</p>
        <Button className={`${baseClass}__button`} el="link" to={`${admin}`}>
          {t('general:backToDashboard')}
        </Button>
      </Gutter>
    </div>
  )
}

export default NotFound
