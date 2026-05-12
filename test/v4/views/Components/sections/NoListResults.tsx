'use client'

import { Button, NoListResults } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const NoListResultsSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section
    fullWidth
    id="no-list-results"
    selectedComponent={selectedComponent}
    title="No List Results"
  >
    <Variant label="Default">
      <NoListResults
        Actions={[
          <Button buttonStyle="primary" key="create" onClick={() => alert('Create new')}>
            Create new
          </Button>,
        ]}
        description="Either none exist or none match the filters you've specified above."
        title="No results"
      />
    </Variant>
    <Variant label="Trash">
      <NoListResults description="You don't have any trashed Documents." />
    </Variant>
  </Section>
)
