'use client'

import type { FormState, TextFieldClientProps } from 'payload'

import { DocumentInfoProvider, Form, OperationProvider, TextField, useAuth } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'

import { conditionsSlug } from '../../collections/Conditions/index.js'
import { SubmissionButton } from './SubmissionButton/index.js'

const validate: NonNullable<TextFieldClientProps['validate']> = (value, { event }) =>
  event === 'submit' && value === 'blocked' ? 'This value is rejected by client validation.' : true

const initialData = { clientValidatedValue: 'blocked' }

const initialState: FormState = {
  clientValidatedValue: {
    initialValue: 'blocked',
    valid: true,
    validate,
    value: 'blocked',
  },
}

const field: TextFieldClientProps['field'] = {
  name: 'clientValidatedValue',
  type: 'text',
  label: 'Client validated value',
}

export const ClientValidationView = () => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <DocumentInfoProvider
      collectionSlug={conditionsSlug}
      currentEditor={user}
      hasPublishedDoc={false}
      initialData={initialData}
      initialState={initialState}
      isLocked={false}
      lastUpdateTime={0}
      mostRecentVersionIsAutosaved={false}
      unpublishedVersionCount={0}
      versionCount={0}
    >
      <OperationProvider operation="create">
        <h1>Client validation</h1>
        {(['submit', 'autosave'] as const).map((submissionType) => (
          <Form
            action={formatAdminURL({ apiRoute: '/api', path: `/${conditionsSlug}` })}
            className={`client-validation-form client-validation-form--${submissionType}`}
            disableSuccessStatus
            disableValidationOnSubmit={false}
            initialState={initialState}
            key={submissionType}
            method="POST"
            schemaPath={conditionsSlug}
            uuid={submissionType}
          >
            <h2>{submissionType === 'submit' ? 'Manual submit' : 'Autosave'}</h2>
            <TextField field={field} path="clientValidatedValue" validate={validate} />
            <SubmissionButton submissionType={submissionType} />
          </Form>
        ))}
      </OperationProvider>
    </DocumentInfoProvider>
  )
}
