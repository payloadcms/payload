import { ElementType } from 'react';

export type Props = {
  id?: string,
  title: string,
  titleAs?: ElementType,
  buttonAriaLabel?: string,
  actions?: React.ReactNode,
  onClick?: () => void,
}
