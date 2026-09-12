import React from 'react'
import { safeHref } from '../../../utilities/safeHref.js'

export type CallToActionBlockProps = {
  title: string
  description?: string | null
  buttonText: string
  buttonLink: string
  theme?: 'dark' | 'light' | 'gradient' | null
}

export function CallToActionBlockComponent({
  title,
  description,
  buttonText,
  buttonLink,
  theme = 'dark',
}: CallToActionBlockProps) {
  const href = safeHref(buttonLink)
  return (
    <section className="block-cta">
      <div className={`block-cta__card block-cta__card--${theme ?? 'dark'}`}>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {buttonText && href ? (
          <a className="template-button" href={href}>
            {buttonText}
          </a>
        ) : null}
      </div>
    </section>
  )
}
