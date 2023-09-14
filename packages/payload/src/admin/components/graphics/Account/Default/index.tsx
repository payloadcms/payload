import React from 'react'

import './index.scss'

const baseClass = 'graphic-account'

export const DefaultAccountIcon: React.FC<{
  active: boolean
}> = (props) => (
  <svg
    className={[baseClass, props?.active && `${baseClass}--active`].filter(Boolean).join(' ')}
    height="25"
    viewBox="0 0 25 25"
    width="25"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className={`${baseClass}__bg`} cx="12.5" cy="12.5" r="11.5" />
    <circle className={`${baseClass}__head`} cx="12.5" cy="10.73" r="3.98" />
    <path
      className={`${baseClass}__body`}
      d="M12.5,24a11.44,11.44,0,0,0,7.66-2.94c-.5-2.71-3.73-4.8-7.66-4.8s-7.16,2.09-7.66,4.8A11.44,11.44,0,0,0,12.5,24Z"
    />
  </svg>
)
