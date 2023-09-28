import React, { Fragment } from 'react'

import './index.scss'
import { Chevron } from '../..'

const baseClass = 'hamburger'

const Hamburger: React.FC<{
  isActive?: boolean
}> = (props) => {
  const { isActive = false } = props

  return (
    <div className={[baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__line ${baseClass}__top`} />
      <div className={`${baseClass}__line ${baseClass}__middle`} />
      <div className={`${baseClass}__line ${baseClass}__bottom`} />
      <Fragment>
        <div className={`${baseClass}__line ${baseClass}__x-left`} />
        <div className={`${baseClass}__line ${baseClass}__x-right`} />
      </Fragment>
      <div className={`${baseClass}__back`}>
        <Chevron className={`${baseClass}__back-chevron`} direction="left" />
        Collapse
      </div>
    </div>
  )
}

export default Hamburger
