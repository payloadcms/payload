import React from 'react'

export type HeroBlockProps = {
  headline: string
  subheadline?: string | null
  ctaText?: string | null
  ctaLink?: string | null
  backgroundImage?: { url?: string | null; alt?: string | null } | number | null
}

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value || /[\u0000-\u001f\u007f"\\)]/.test(value)) return null
  if (value.startsWith('/')) return value
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

export function HeroBlockComponent({
  headline,
  subheadline,
  ctaText,
  ctaLink,
  backgroundImage,
}: HeroBlockProps) {
  const imageUrl = safeImageUrl(
    typeof backgroundImage === 'object' && backgroundImage ? backgroundImage.url : null,
  )
  return (
    <section
      className="block-hero"
      style={
        imageUrl
          ? {
              backgroundImage: `linear-gradient(rgba(8,9,10,.72),rgba(8,9,10,.72)),url("${imageUrl}")`,
            }
          : undefined
      }
    >
      <div className="block-hero__inner">
        <h1>{headline}</h1>
        {subheadline ? <p>{subheadline}</p> : null}
        {ctaText && ctaLink ? (
          <a className="template-button" href={ctaLink}>
            {ctaText}
          </a>
        ) : null}
      </div>
    </section>
  )
}
