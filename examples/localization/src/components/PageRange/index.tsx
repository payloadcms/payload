import { useTranslations } from 'next-intl'
import React from 'react'

export const PageRange: React.FC<{
  className?: string
  collection?: string
  collectionLabels?: {
    plural?: string
    singular?: string
  }
  currentPage?: number
  limit?: number
  totalDocs?: number
}> = (props) => {
  const { className, currentPage, limit, totalDocs } = props
  const t = useTranslations()

  let indexStart = (currentPage ? currentPage - 1 : 1) * (limit || 1) + 1
  if (totalDocs && indexStart > totalDocs) indexStart = 0

  let indexEnd = (currentPage || 1) * (limit || 1)
  if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {(typeof totalDocs === 'undefined' || totalDocs === 0) && 'Search produced no results.'}
      {typeof totalDocs !== 'undefined' &&
        totalDocs > 0 &&
        `${t('showing')} ${indexStart}${indexStart > 0 ? ` - ${indexEnd}` : ''} ${t('of')} ${totalDocs} ${
          totalDocs > 1 ? t('posts').toLowerCase() : t('post').toLowerCase()
        }`}
    </div>
  )
}
