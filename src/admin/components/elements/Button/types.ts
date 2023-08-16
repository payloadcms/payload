import React, { ElementType, MouseEvent } from 'react';

export type Props = {
  className?: string,
  id?: string,
  type?: 'submit' | 'button',
  el?: 'link' | 'anchor' | ElementType,
  to?: string,
  url?: string,
  children?: React.ReactNode,
  onClick?: (event: MouseEvent) => void,
  disabled?: boolean,
  icon?: React.ReactNode | ['chevron' | 'x' | 'plus' | 'edit'],
  iconStyle?: 'with-border' | 'without-border' | 'none',
  buttonStyle?: 'primary' | 'secondary' | 'transparent' | 'error' | 'none' | 'icon-label',
  buttonId?: string,
  round?: boolean,
  size?: 'small' | 'medium',
  iconPosition?: 'left' | 'right',
  newTab?: boolean
  tooltip?: string
  'aria-label'?: string
}
