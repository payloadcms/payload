'use client'
import React from 'react'

export type PageProps = {
  isCurrent?: boolean
  isFirstPage?: boolean
  isLastPage?: boolean
  page?: number
  updatePage?: (page) => void
}

const baseClass = 'paginator__page'

export const Page: React.FC<PageProps> = ({
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
