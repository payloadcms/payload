import * as React from 'react'
import { CollapsibleContent, CollapsibleToggler, useCollapsible } from '@faceless-ui/collapsibles'
import { ChevronIcon } from '../icons/ChevronIcon'
import { EyeIcon } from '../icons/EyeIcon'

import classes from './index.module.scss'

const Icons = {
  eye: EyeIcon,
  chevron: ChevronIcon,
}

const IconToRender: React.FC<{ icon: 'eye' | 'chevron' }> = ({ icon }) => {
  const { isOpen } = useCollapsible()

  if (icon === 'eye') {
    return <EyeIcon closed={isOpen} size="large" />
  }

  const Icon = Icons[icon]
  return <Icon />
}

type HeaderProps = {
  label: React.ReactNode
  onToggle?: () => void
  toggleIcon?: 'eye' | 'chevron'
}
const Header: React.FC<HeaderProps> = ({ label, onToggle, toggleIcon = 'eye' }) => {
  return (
    <div className={classes.header} data-accordion-header>
      <div className={classes.labelContent} data-accordion-header-content>
        {label}
      </div>

      <CollapsibleToggler
        className={[classes.toggler, classes[`icon--${toggleIcon}`]].filter(Boolean).join(' ')}
        onClick={onToggle}
        data-accordion-header-toggle
      >
        <IconToRender icon={toggleIcon} />
      </CollapsibleToggler>
    </div>
  )
}

type ContentProps = {
  children: React.ReactNode
}
const Content: React.FC<ContentProps> = ({ children }) => {
  return (
    <CollapsibleContent>
      <div className={classes.collapsibleContent} data-accordion-content>
        {children}
      </div>
    </CollapsibleContent>
  )
}

type AccordionProps = HeaderProps &
  ContentProps & {
    className?: string
  }
export const Accordion: React.FC<AccordionProps> = ({ children, className, ...rest }) => {
  return (
    <div className={[classes.accordion, className].filter(Boolean).join(' ')}>
      <Header {...rest} />
      <Content>{children}</Content>
    </div>
  )
}
