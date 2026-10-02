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
  title,
  ...rest
}) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(Boolean(src))
  }, [src])

  const onLoad = useCallback<React.IframeHTMLAttributes<HTMLIFrameElement>['onLoad']>(
    (e) => {
      if (typeof onLoadFromProps === 'function') {
        onLoadFromProps(e)
      }
      setIsLoading(false)
    },
    [onLoadFromProps],
  )

  return (
    <div className={`${baseClass}__container`}>
      <span aria-atomic="true" className="sr-only" role="status">
        {isLoading ? t('general:loading') : ''}
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
        title={title}
      />
    </div>
  )
}
