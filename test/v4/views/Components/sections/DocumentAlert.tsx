'use client'

import { Button, DocumentLocked, DocumentTakeOver } from '@payloadcms/ui'
import React, { useState } from 'react'

import { DocumentStaleData } from '../../../../../packages/ui/src/elements/DocumentStaleData/index.js'
import { Section, Variant } from '../shared.js'

export const DocumentAlertSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => {
  const [lockedActive, setLockedActive] = useState(false)
  const [takeOverActive, setTakeOverActive] = useState(false)
  const [staleActive, setStaleActive] = useState(false)

  return (
    <Section id="document-alert" selectedComponent={selectedComponent} title="Document Alerts">
      <Variant label="Document Locked">
        <Button buttonStyle="secondary" onClick={() => setLockedActive(true)}>
          Open Modal
        </Button>
        <DocumentLocked
          handleGoBack={() => setLockedActive(false)}
          isActive={lockedActive}
          onReadOnly={() => setLockedActive(false)}
          onTakeOver={() => setLockedActive(false)}
          updatedAt={Date.now() - 60000}
          user={{
            id: '123',
            collection: 'users',
            createdAt: '',
            email: 'other-user@example.com',
            updatedAt: '',
          }}
        />
      </Variant>
      <Variant label="Document Take Over">
        <Button buttonStyle="secondary" onClick={() => setTakeOverActive(true)}>
          Open Modal
        </Button>
        <DocumentTakeOver
          handleBackToDashboard={() => setTakeOverActive(false)}
          isActive={takeOverActive}
          onReadOnly={() => setTakeOverActive(false)}
        />
      </Variant>
      <Variant label="Stale Data">
        <Button buttonStyle="secondary" onClick={() => setStaleActive(true)}>
          Open Modal
        </Button>
        <DocumentStaleData isActive={staleActive} onReload={() => setStaleActive(false)} />
      </Variant>
    </Section>
  )
}
