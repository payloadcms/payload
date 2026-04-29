import type { FormState } from 'payload'

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { AdminValidateErrorsProvider } from '../../providers/AdminValidateErrors/index.js'
import { FormFieldsContext, SubmittedContext } from '../../forms/Form/context.js'
import { FieldError } from './index.js'

const PATH = 'posts.title'

function FormHarness({
  children,
  errors,
  fields,
  submitted = false,
}: {
  children: React.ReactNode
  errors?: Map<string, string>
  fields: FormState
  submitted?: boolean
}) {
  const tree = (
    // eslint-disable-next-line @eslint-react/no-context-provider
    <FormFieldsContext.Provider value={[fields, () => null]}>
      <SubmittedContext value={submitted}>{children}</SubmittedContext>
    </FormFieldsContext.Provider>
  )

  if (!errors) {
    return tree
  }
  return <AdminValidateErrorsProvider errors={errors}>{tree}</AdminValidateErrorsProvider>
}

// Tooltip renders the message inside `.tooltip-content`. With staticPositioning
// (always set by FieldError), only one aside is mounted, so there's exactly one
// `.tooltip-content` node when an error is shown.
function getTooltipText(container: HTMLElement): null | string {
  const node = container.querySelector('.tooltip-content')
  return node ? node.textContent : null
}

describe('FieldError', () => {
  // Vitest project does not enable globals/auto-cleanup, so unmount manually
  // between cases to keep the global jsdom document free of stale nodes.
  afterEach(() => {
    cleanup()
  })

  it('renders null when no provider, not submitted, and no errors', () => {
    const { container } = render(
      <FormHarness fields={{ [PATH]: { valid: true } }}>
        <FieldError path={PATH} />
      </FormHarness>,
    )
    expect(getTooltipText(container)).toBeNull()
  })

  it('renders tooltip with formState errorMessage when submitted and field is invalid', () => {
    const { container } = render(
      <FormHarness
        fields={{ [PATH]: { errorMessage: 'server says no', valid: false } }}
        submitted={true}
      >
        <FieldError path={PATH} />
      </FormHarness>,
    )
    expect(getTooltipText(container)).toBe('server says no')
  })

  it('renders provider error regardless of submit state when AdminValidateErrors has an entry for the path', () => {
    const errors = new Map<string, string>([[PATH, 'client says no']])
    const { container } = render(
      <FormHarness errors={errors} fields={{ [PATH]: { valid: true } }} submitted={false}>
        <FieldError path={PATH} />
      </FormHarness>,
    )
    expect(getTooltipText(container)).toBe('client says no')
  })

  it('provider error wins over formState errorMessage when both are present', () => {
    const errors = new Map<string, string>([[PATH, 'client error']])
    const { container } = render(
      <FormHarness
        errors={errors}
        fields={{ [PATH]: { errorMessage: 'server error', valid: false } }}
        submitted={true}
      >
        <FieldError path={PATH} />
      </FormHarness>,
    )
    expect(getTooltipText(container)).toBe('client error')
  })

  it('messageFromProps overrides both provider and formState messages', () => {
    const errors = new Map<string, string>([[PATH, 'client error']])
    const { container } = render(
      <FormHarness
        errors={errors}
        fields={{ [PATH]: { errorMessage: 'server error', valid: false } }}
        submitted={true}
      >
        <FieldError message="explicit prop" path={PATH} />
      </FormHarness>,
    )
    expect(getTooltipText(container)).toBe('explicit prop')
  })

  it('showErrorFromProps forces the formState errorMessage to render even when not submitted', () => {
    const { container } = render(
      <FormHarness
        fields={{ [PATH]: { errorMessage: 'server error', valid: false } }}
        submitted={false}
      >
        <FieldError path={PATH} showError={true} />
      </FormHarness>,
    )
    expect(getTooltipText(container)).toBe('server error')
  })
})
