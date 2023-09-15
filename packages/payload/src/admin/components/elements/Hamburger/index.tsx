import React from 'react'

import './index.scss'

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
      <div className={`${baseClass}__line ${baseClass}__x-left`} />
      <div className={`${baseClass}__line ${baseClass}__x-right`} />
    </div>
  )
}

export default Hamburger
