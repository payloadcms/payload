'use client'

import { SearchBar } from '@payloadcms/ui/elements/SearchBar'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const SearchBarSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => {
  return (
    <Section id="search-bar" selectedComponent={selectedComponent} title="Search Bar">
      <Variant label="Default with placeholder">
        <SearchBar label="Search..." onSearchChange={() => {}} />
      </Variant>
      <Variant label="With value">
        <SearchBar label="Search..." onSearchChange={() => {}} searchQueryParam="Example value" />
      </Variant>
      <Variant label="Disabled">
        <SearchBar
          disabled
          label="Search..."
          onSearchChange={() => {}}
          searchQueryParam="Disabled value"
        />
      </Variant>
      <Variant label="Focused">
        <SearchBar
          className="search-bar--force-focus"
          label="Search..."
          onSearchChange={() => {}}
        />
        <style>{`.search-bar--force-focus { outline-color: var(--color-border-selected) !important; }`}</style>
      </Variant>
    </Section>
  )
}
