'use client'

import React, { useCallback, useMemo } from 'react'

const baseClass = 'hierarchy-search-result-item'

type HierarchySearchResultItemProps = {
  id: number | string
  onClick: (id: number | string) => void
  path: string
  title: string
  truncateSegments?: number
}

export const HierarchySearchResultItem: React.FC<HierarchySearchResultItemProps> = ({
  id,
  onClick,
  path,
  title,
  truncateSegments = 3,
}) => {
  const handleClick = useCallback(() => {
    onClick(id)
  }, [id, onClick])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick(id)
      }
    },
    [id, onClick],
  )

  const truncatedPath = useMemo(() => {
    if (!path) {
      return ''
    }

    const segments = path.split(' / ')

    if (segments.length <= truncateSegments) {
      return path
    }

    return '... / ' + segments.slice(-truncateSegments).join(' / ')
  }, [path, truncateSegments])

  return (
    <div
      className={baseClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={`${baseClass}__title`}>{title}</div>
      {truncatedPath && <div className={`${baseClass}__path`}>{truncatedPath}</div>}
    </div>
  )
}
