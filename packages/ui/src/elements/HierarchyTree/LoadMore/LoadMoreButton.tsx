'use client'

import React, { useCallback, useRef } from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { useFocusableItem } from '../TreeFocusContext.js'

type LoadMoreButtonProps = {
  id: string
  onLoadMore: (() => Promise<void>) | (() => void)
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ id, onLoadMore }) => {
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { handleFocus, tabIndex } = useFocusableItem({
    id,
    type: 'load-more',
    ref: buttonRef,
  })

  const handleClick = useCallback(async () => {
    await onLoadMore()
  }, [onLoadMore])

  return (
    <button
      className="hierarchy-tree__load-more-button"
      onClick={handleClick}
      onFocus={handleFocus}
      ref={buttonRef}
      tabIndex={tabIndex}
      type="button"
    >
      {t('general:loadMore')}
    </button>
  )
}
