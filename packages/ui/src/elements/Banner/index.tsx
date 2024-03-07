import Link from 'next/link.js'
import React from 'react' // TODO: abstract this out to support all routers

import type { Props, RenderedTypeProps } from './types.d.ts'

import './index.scss'

const baseClass = 'banner'

export const Banner: React.FC<Props> = ({
  type = 'default',
  alignIcon = 'right',
  children,
  className,
  icon,
  onClick,
  to,
}) => {
  const classes = [
    baseClass,
    `${baseClass}--type-${type}`,
    className && className,
    to && `${baseClass}--has-link`,
    (to || onClick) && `${baseClass}--has-action`,
    icon && `${baseClass}--has-icon`,
    icon && `${baseClass}--align-icon-${alignIcon}`,
  ]
    .filter(Boolean)
    .join(' ')

  let RenderedType: React.ComponentType<RenderedTypeProps> | React.ElementType = 'div'

  if (onClick && !to) RenderedType = 'button'
  if (to) RenderedType = Link

  return (
    <RenderedType className={classes} href={to || ''} onClick={onClick}>
      {icon && alignIcon === 'left' && <React.Fragment>{icon}</React.Fragment>}
      <span className={`${baseClass}__content`}>{children}</span>
      {icon && alignIcon === 'right' && <React.Fragment>{icon}</React.Fragment>}
    </RenderedType>
  )
}

export default Banner
