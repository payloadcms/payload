'use client'

import { SearchInput } from '@payloadcms/ui'
import React, { useState } from 'react'

import { Section, Variant } from '../shared.js'

export const SearchBarSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => {
  const [value, setValue] = useState('')

  return (
    <Section id="search-bar" selectedComponent={selectedComponent} title="Search">
      <Variant label="SearchInput: default">
        <SearchInput onChange={setValue} placeholder="Search..." value={value} />
      </Variant>
      <Variant label="SearchInput: with value and clear">
        <SearchInput
          onChange={setValue}
          onClear={() => setValue('')}
          placeholder="Search..."
          value={value || 'Example value'}
        />
      </Variant>
      <Variant label="SearchInput: disabled">
        <SearchInput disabled onChange={setValue} placeholder="Search..." value="Disabled value" />
      </Variant>
      <Variant label="SearchInput: focused">
        <SearchInput
          className="search-bar--force-focus"
          onChange={setValue}
          placeholder="Search..."
          value={value}
        />
        <style>{`.search-bar--force-focus { outline-color: var(--color-border-selected) !important; }`}</style>
      </Variant>
    </Section>
  )
}
