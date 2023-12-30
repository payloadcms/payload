import React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../../elements/Button'
import { Gutter } from '../../elements/Gutter'
import { useStepNav } from '../../elements/StepNav'
import { useConfig } from '../../providers/Config'
// import Meta from '../../utilities/Meta'
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

  // useEffect(() => {
  //   setStepNav([
  //     {
  //       label: t('notFound'),
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
        description={t('pageNotFound')}
        keywords={`404 ${t('notFound')}`}
        title={t('notFound')}
      /> */}
      <Gutter className={`${baseClass}__wrap`}>
        <h1>
          Nothing Found
          {/* {t('nothingFound')} */}
        </h1>
        <p>
          Sorry, we couldn't find what you were looking for.
          {/* {t('sorryNotFound')} */}
        </p>
        <Button className={`${baseClass}__button`} el="link" to={`${admin}`}>
          Back to Dashboard
          {/* {t('backToDashboard')} */}
        </Button>
      </Gutter>
    </div>
  )
}

export default NotFound
