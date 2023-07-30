import React from 'react'

import classes from './index.module.scss'

export const defaultCollectionLabels = {
  projects: {
    singular: 'Project',
    plural: 'Projects',
  },
  posts: {
    singular: 'Post',
    plural: 'Posts',
  },
  default: {
    singular: 'Doc',
    plural: 'Docs',
  },
}

export const PageRange: React.FC<{
  className?: string
  totalDocs?: number
  currentPage?: number
  collection?: string
  limit?: number
  collectionLabels?: {
    singular?: string
    plural?: string
  }
}> = props => {
  const {
    className,
    totalDocs,
    currentPage,
    collection,
    limit,
    collectionLabels: collectionLabelsFromProps,
  } = props

  const indexStart = (currentPage ? currentPage - 1 : 1) * (limit || 1) + 1
  let indexEnd = (currentPage || 1) * (limit || 1)
  if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs

  const { singular, plural } =
    collectionLabelsFromProps || defaultCollectionLabels[collection || 'default'] || {}

  return (
    <div className={[className, classes.pageRange].filter(Boolean).join(' ')}>
      {(typeof totalDocs === 'undefined' || totalDocs === 0) && 'Search produced no results.'}
      {typeof totalDocs !== 'undefined' &&
        totalDocs > 0 &&
        `Showing ${indexStart} - ${indexEnd} of ${totalDocs} ${totalDocs > 1 ? plural : singular}`}
    </div>
  )
}
