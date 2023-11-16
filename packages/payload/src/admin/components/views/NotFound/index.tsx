import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '../../elements/Button'
import { Gutter } from '../../elements/Gutter'
import { useStepNav } from '../../elements/StepNav'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import './index.scss'

const baseClass = 'not-found'

const NotFound: React.FC<{
  marginTop?: 'large'
}> = (props) => {
  const { marginTop } = props

  const { setStepNav } = useStepNav()

  const {
    routes: { admin },
  } = useConfig()

  const { t } = useTranslation('general')

  useEffect(() => {
    setStepNav([
      {
        label: t('notFound'),
      },
    ])
  }, [setStepNav, t])

  return (
    <div
      className={[baseClass, marginTop && `${baseClass}--margin-top-${marginTop}`]
        .filter(Boolean)
        .join(' ')}
    >
      <Meta
        description={t('pageNotFound')}
        keywords={`404 ${t('notFound')}`}
        title={t('notFound')}
      />
      <Gutter className={`${baseClass}__wrap`}>
        <h1>{t('nothingFound')}</h1>
        <p>{t('sorryNotFound')}</p>
        <Button className={`${baseClass}__button`} el="link" to={`${admin}`}>
          {t('backToDashboard')}
        </Button>
      </Gutter>
    </div>
  )
}

export default NotFound
