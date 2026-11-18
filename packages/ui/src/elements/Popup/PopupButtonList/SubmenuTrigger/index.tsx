'use client'
import type { ReactNode } from 'react'

import type { PopupButtonRenderProps } from '../../PopupTrigger/index.js'

import { Button } from '../../../Button/index.js'
import './index.css'

const baseClass = 'popup-button-list__submenu-trigger'

type SubmenuTriggerProps = {
  buttonProps: PopupButtonRenderProps
  children: ReactNode
  className?: string
  icon?: ReactNode
  trailingIcon?: ReactNode
}

export const SubmenuTrigger: React.FC<SubmenuTriggerProps> = ({
  buttonProps: { active, role, tabIndex, ...triggerProps },
  children,
  className,
  icon,
  trailingIcon,
}) => (
  <Button
    {...triggerProps}
    buttonStyle="ghost"
    className={[baseClass, className].filter(Boolean).join(' ')}
    extraButtonProps={{ role, tabIndex }}
    margin={false}
    selected={active}
  >
    <span className={`${baseClass}__content`}>
      {icon ? (
        <span aria-hidden="true" className={`${baseClass}__icon`}>
          {icon}
        </span>
      ) : null}
      <span className={`${baseClass}__label`}>{children}</span>
      {trailingIcon ? (
        <span aria-hidden="true" className={`${baseClass}__trailing-icon`}>
          {trailingIcon}
        </span>
      ) : null}
    </span>
  </Button>
)
