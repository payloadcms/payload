import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '../../elements/Button'
import { Gutter } from '../../elements/Gutter'
import { useStepNav } from '../../elements/StepNav'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'

const baseClass = 'not-found'

const NotFound: React.FC = () => {
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
    <div className={baseClass}>
      <Meta
        description={t('pageNotFound')}
        keywords={`404 ${t('notFound')}`}
        title={t('notFound')}
      />
      <Gutter className={`${baseClass}__wrap`}>
        <h1>{t('nothingFound')}</h1>
        <p>{t('sorryNotFound')}</p>
        <Button el="link" to={`${admin}`}>
          {t('backToDashboard')}
        </Button>
      </Gutter>
    </div>
  )
}

export default NotFound
