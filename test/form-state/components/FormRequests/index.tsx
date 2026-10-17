'use client'

import type { FormState } from 'payload'

import { Form, useConfig, useField, useForm, useSearchParams } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { useCallback, useEffect, useRef } from 'react'

const initialState: FormState = { title: { value: 'Initial value' } }
const fieldOptions = { path: 'title' }

export function FormRequests() {
  const scenario = useSearchParams().get('scenario')
  const formRef = useRef<ReturnType<typeof useForm>>(null)
  const { config } = useConfig()
  const action = formatAdminURL({ apiRoute: config.routes.api, path: '/form-request' })
  const resetAction = formatAdminURL({ apiRoute: config.routes.api, path: '/form-request-reset' })

  const onReady = useCallback(({ form }: { form: ReturnType<typeof useForm> }) => {
    formRef.current = form
  }, [])

  const onSuccess = useCallback(async () => {
    if (scenario === 'reset') {
      await fetch(resetAction)
      formRef.current?.replaceState({ title: { value: 'Reset value' } })
    }
  }, [resetAction, scenario])

  return (
    <Form
      action={action}
      initialState={scenario === 'empty' ? undefined : initialState}
      method="POST"
      onSuccess={onSuccess}
      waitForAutocomplete={scenario === 'autocomplete'}
    >
      <RequestControls onReady={onReady} scenario={scenario} />
    </Form>
  )
}

function RequestControls({
  onReady,
  scenario,
}: {
  onReady: (args: { form: ReturnType<typeof useForm> }) => void
  scenario: null | string
}) {
  const form = useForm()
  const { disabled, setValue, value } = useField<string>(fieldOptions)

  useEffect(() => {
    onReady({ form })
  }, [form, onReady])

  return (
    <>
      <label>
        Title
        <input
          aria-label="Title"
          disabled={disabled}
          id="request-title"
          onChange={(event) => setValue(event.target.value)}
          value={value ?? ''}
        />
      </label>
      <button
        disabled={disabled}
        onClick={() => {
          const submission = form.submit()

          if (scenario === 'autocomplete') {
            setValue('Autofilled value')
          }

          void submission
        }}
        type="button"
      >
        Submit request
      </button>
    </>
  )
}
