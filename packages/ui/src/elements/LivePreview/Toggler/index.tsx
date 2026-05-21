import React from 'react'

import { Button } from '../../Button/index.js'
import { EyeIcon } from '../../../icons/Eye/index.js'
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'live-preview-toggler'

export const LivePreviewToggler: React.FC = () => {
  const { isLivePreviewing, setIsLivePreviewing, url: livePreviewURL } = useLivePreviewContext()
  const { t } = useTranslation()

  if (!livePreviewURL) {
    return null
  }

  const label = isLivePreviewing ? t('general:exitLivePreview') : t('general:livePreview')

  return (
    <Button
      aria-label={label}
      buttonStyle="ghost"
      className={[baseClass, isLivePreviewing && `${baseClass}--active`].filter(Boolean).join(' ')}
      icon={<EyeIcon active={isLivePreviewing} />}
      id="live-preview-toggler"
      onClick={() => {
        setIsLivePreviewing(!isLivePreviewing)
      }}
      tooltip={label}
    />
  )
}
