import React from 'react'

export function CollectionsExplained() {
  return (
    <div>
      <h1>Which collection should I use for my tests?</h1>

      <p>
        By default and as a rule of thumb: "Lexical Fully Featured". This collection has all our
        features, but it does NOT have (and will never have):
      </p>
      <ul>
        <li>Relationships or dependencies to other collections</li>
        <li>Seeded documents</li>
        <li>Features with custom props (except for a block and an inline block included)</li>
        <li>Multiple richtext fields or other fields</li>
      </ul>

      <p>If you need any of these features, use another collection or create a new one.</p>
    </div>
  )
}
