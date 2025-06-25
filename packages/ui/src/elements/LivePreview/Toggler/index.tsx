import React from 'react'

import { EyeIcon } from '../../../icons/Eye/index.js'
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'live-preview-toggler'

export const LivePreviewToggler: React.FC = () => {
  const { isLivePreviewing, setIsLivePreviewing } = useLivePreviewContext()
  const { t } = useTranslation()

  return (
    <button
      aria-label={isLivePreviewing ? t('general:exitLivePreview') : t('general:livePreview')}
      className={[baseClass, isLivePreviewing && `${baseClass}--active`].filter(Boolean).join(' ')}
      id="live-preview-toggler"
      onClick={() => {
        setIsLivePreviewing(!isLivePreviewing)
      }}
      title={isLivePreviewing ? t('general:exitLivePreview') : t('general:livePreview')}
      type="button"
    >
      <EyeIcon active={isLivePreviewing} />
    </button>
  )
}
