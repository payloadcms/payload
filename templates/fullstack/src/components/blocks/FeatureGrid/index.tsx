import React from 'react'

export type FeatureGridBlockProps = {
  sectionTitle: string
  sectionDescription?: string | null
  features: Array<{ title: string; description: string; icon?: string | null; id?: string | null }>
}

export function FeatureGridBlockComponent({
  sectionTitle,
  sectionDescription,
  features,
}: FeatureGridBlockProps) {
  return (
    <section className="block-feature-grid">
      <header>
        <h2>{sectionTitle}</h2>
        {sectionDescription ? <p>{sectionDescription}</p> : null}
      </header>
      <div className="block-feature-grid__items">
        {features.map((feature, index) => (
          <article className="feature-card" key={feature.id ?? `${feature.title}-${index}`}>
            {feature.icon ? (
              <span className="feature-card__icon" aria-hidden="true">
                {feature.icon.slice(0, 2).toUpperCase()}
              </span>
            ) : null}
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
