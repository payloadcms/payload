'use client'

import type { FormState } from 'payload'

import {
  Form,
  useAllFormFields,
  useConfig,
  useField,
  useForm,
  useFormProcessing,
  useSearchParams,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

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

  const onChange = useCallback(
    async ({ formState }: { formState: FormState }) => {
      const response = await fetch(`${action}-change`, {
        body: JSON.stringify(formState),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      return response.json() as Promise<FormState>
    },
    [action],
  )

  const onChangeHandlers = useMemo(
    () => (scenario === 'queue' ? [onChange] : undefined),
    [onChange, scenario],
  )

  const onSuccess = useCallback(
    async (json: { state?: FormState }) => {
      if (scenario === 'reset') {
        await fetch(resetAction)
        formRef.current?.replaceState({ title: { value: 'Reset value' } })
      }

      return json.state
    },
    [resetAction, scenario],
  )

  return (
    <Form
      action={action}
      initialState={scenario === 'empty' ? undefined : initialState}
      method="POST"
      onChange={onChangeHandlers}
      onSuccess={onSuccess}
      waitForAutocomplete={scenario === 'autocomplete'}
    >
      <RequestControls onReady={onReady} scenario={scenario} />
      {scenario === 'context' && (
        <>
          <ContextControls />
          <ContextObserver />
        </>
      )}
    </Form>
  )
}

function ContextControls() {
  const { setProcessing } = useForm()
  const processing = useFormProcessing()

  return (
    <button onClick={() => setProcessing(!processing)} type="button">
      {processing ? 'Stop processing' : 'Start processing'}
    </button>
  )
}

const ContextObserver = memo(function ContextObserver() {
  const fields = useAllFormFields()
  const updates = useRef(0)
  const output = useRef<HTMLOutputElement>(null)

  useEffect(() => {
    updates.current += 1
    if (output.current) {
      output.current.textContent = String(updates.current)
    }
  }, [fields])

  return (
    <output data-testid="field-context-updates" ref={output}>
      0
    </output>
  )
})

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
      {scenario === 'queue' && (
        <>
          <button
            onClick={() =>
              void form.submit({ disableFormWhileProcessing: false, submissionType: 'autosave' })
            }
            type="button"
          >
            Autosave request
          </button>
          <button onClick={() => form.replaceState(initialState)} type="button">
            Reset request
          </button>
        </>
      )}
    </>
  )
}
