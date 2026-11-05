'use client'

import { Button, FieldErrorsToast, toast } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const ToastSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="toast" selectedComponent={selectedComponent} title="Toast Notifications">
    <Variant label="Success">
      <Button buttonStyle="secondary" onClick={() => toast.success('Document saved successfully!')}>
        Show Success
      </Button>
    </Variant>

    <Variant label="Error">
      <Button
        buttonStyle="secondary"
        onClick={() => toast.error('Failed to save document. Please try again.')}
      >
        Show Error
      </Button>
    </Variant>

    <Variant label="Info">
      <Button
        buttonStyle="secondary"
        onClick={() => toast.info('Your session will expire in 5 minutes.')}
      >
        Show Info
      </Button>
    </Variant>

    <Variant label="Warning">
      <Button
        buttonStyle="secondary"
        onClick={() => toast.warning('This action may take a while.')}
      >
        Show Warning
      </Button>
    </Variant>

    <Variant label="With Promise">
      <Button
        buttonStyle="secondary"
        onClick={() => {
          const promise = new Promise((resolve) => setTimeout(resolve, 2000))
          toast.promise(promise, {
            error: 'Failed to process',
            loading: 'Processing...',
            success: 'Processing complete!',
          })
        }}
      >
        Show Loading Toast
      </Button>
    </Variant>

    <Variant label="Field Errors">
      <Button
        buttonStyle="secondary"
        onClick={() =>
          toast.error(
            <FieldErrorsToast errorMessage="The following fields are invalid: title, description, author > name, related article, variant, title" />,
          )
        }
      >
        Show Field Errors
      </Button>
    </Variant>
  </Section>
)
