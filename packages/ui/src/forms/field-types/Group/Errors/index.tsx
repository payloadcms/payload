'use client'
import React, { Fragment } from 'react'
import { ErrorPill, useTranslation } from '../../../..'
import { WatchChildErrors } from '../../../WatchChildErrors'

export const GroupFieldErrors: React.FC<{
  pathSegments: string[]
}> = (props) => {
  const { pathSegments } = props

  const [errorCount, setErrorCount] = React.useState(0)

  const { i18n } = useTranslation()

  return (
    <Fragment>
      <WatchChildErrors pathSegments={pathSegments} setErrorCount={setErrorCount} />{' '}
      <ErrorPill count={errorCount} i18n={i18n} withMessage />
    </Fragment>
  )
}
