import React from 'react'

import type { Props } from './types'

const baseClass = 'paginator__page'

const Page: React.FC<Props> = ({
  isCurrent,
  isFirstPage = false,
  isLastPage = false,
  page = 1,
  updatePage,
}) => {
  const classes = [
    baseClass,
    isCurrent && `${baseClass}--is-current`,
    isFirstPage && `${baseClass}--is-first-page`,
    isLastPage && `${baseClass}--is-last-page`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} onClick={() => updatePage(page)} type="button">
      {page}
    </button>
  )
}

export default Page
