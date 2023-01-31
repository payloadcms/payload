import Link from 'next/link';
import React from 'react';
import classes from './index.module.scss';

export type Props = {
  label: string
  appearance?: 'default' | 'primary' | 'secondary'
  el?: 'button' | 'link' | 'a'
  onClick?: () => void
  href?: string
  form?: string
  newTab?: boolean
  className?: string
}

const elements = {
  a: 'a',
  link: Link,
  button: 'button',
}

export const Button: React.FC<Props> = ({
  el = 'button',
  label,
  newTab,
  href,
  form,
  appearance,
  className: classNameFromProps
}) => {
  const newTabProps = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const Element = elements[el];
  const className = [classNameFromProps, classes[`appearance--${appearance}`], classes.button].filter(Boolean).join(' ');

  const elementProps = {
    ...newTabProps,
    href,
    className,
    form,
  }

  const content = (
    <div className={classes.content}>
      <span className={classes.label}>
        {label}
      </span>
    </div>
  )

  return (
    <Element {...elementProps}>
      <React.Fragment>
        {el === 'link' && (
          <a {...newTabProps} href={href} className={elementProps.className}>
            {content}
          </a>
        )}
        {el !== 'link' && (
          <React.Fragment>
            {content}
          </React.Fragment>
        )}
      </React.Fragment>
    </Element>
  )
}
