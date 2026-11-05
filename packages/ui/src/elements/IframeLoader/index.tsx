import { useCallback, useEffect, useState } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { DelayedSpinner } from '../DelayedSpinner/index.js'
import './index.css'

export type IframeLoaderProps = {
  ref?: React.Ref<HTMLIFrameElement>
} & React.IframeHTMLAttributes<HTMLIFrameElement>

const baseClass = 'iframe-loader'

/**
 * Loads an `iframe` element with the given source behind a loading indicator.
 */
export const IframeLoader: React.FC<IframeLoaderProps> = ({
  onLoad: onLoadFromProps,
  src,
  srcDoc,
  title,
  ...rest
}) => {
  const { t } = useTranslation()
  const [loadedSource, setLoadedSource] = useState({ hasLoaded: false, src, srcDoc })
  const [loadingAnnouncement, setLoadingAnnouncement] = useState('')

  if (loadedSource.src !== src || loadedSource.srcDoc !== srcDoc) {
    setLoadedSource({ hasLoaded: false, src, srcDoc })
  }

  const isLoading = Boolean(src || srcDoc) && !loadedSource.hasLoaded

  useEffect(() => {
    setLoadingAnnouncement(isLoading ? t('general:loading') : '')
  }, [isLoading, t])

  const onLoad = useCallback<React.IframeHTMLAttributes<HTMLIFrameElement>['onLoad']>(
    (e) => {
      if (typeof onLoadFromProps === 'function') {
        onLoadFromProps(e)
      }
      setLoadedSource({ hasLoaded: true, src, srcDoc })
    },
    [onLoadFromProps, src, srcDoc],
  )

  return (
    <div className={`${baseClass}__container`}>
      <span aria-atomic="true" className="sr-only" role="status">
        {loadingAnnouncement}
      </span>
      <DelayedSpinner baseClass={baseClass} isLoading={isLoading} />
      <iframe
        {...rest}
        className={[`${baseClass}__iframe`, isLoading && `${baseClass}__iframe--is-loading`]
          .filter(Boolean)
          .join(' ')}
        onLoad={onLoad}
        // eslint-disable-next-line
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        src={src}
        srcDoc={srcDoc}
        title={title}
      />
    </div>
  )
}
