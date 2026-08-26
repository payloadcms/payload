'use client'

import type { TFunction } from '@payloadcms/translations'
import type { FormState } from 'payload'

import { EmailAndUsernameFields, Form, useTranslation } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant, VariantRow } from '../../shared.js'

const emailDefault: FormState = {
  email: { initialValue: '', valid: true, value: '' },
}

const emailWithValue: FormState = {
  email: { initialValue: 'email@payloadcms.com', valid: true, value: 'email@payloadcms.com' },
}

const emailError: FormState = {
  email: {
    errorMessage: '',
    initialValue: '',
    valid: false,
    value: '',
  },
}

const bothDefault: FormState = {
  email: { initialValue: '', valid: true, value: '' },
  username: { initialValue: '', valid: true, value: '' },
}

const bothWithValue: FormState = {
  email: { initialValue: 'email@payloadcms.com', valid: true, value: 'email@payloadcms.com' },
  username: { initialValue: 'figgy', valid: true, value: 'figgy' },
}

const bothError: FormState = {
  email: {
    errorMessage: '',
    initialValue: '',
    valid: false,
    value: '',
  },
  username: {
    errorMessage: 'Username is required',
    initialValue: '',
    valid: false,
    value: '',
  },
}

const usernameDefault: FormState = {
  username: { initialValue: '', valid: true, value: '' },
}

const usernameWithValue: FormState = {
  username: { initialValue: 'figgy', valid: true, value: 'figgy' },
}

const usernameError: FormState = {
  username: {
    errorMessage: 'Username is required',
    initialValue: '',
    valid: false,
    value: '',
  },
}

const loginWithBoth = { allowEmailLogin: true, requireEmail: true, requireUsername: true } as const
const loginWithUsernameOnly = {
  allowEmailLogin: false,
  requireEmail: false,
  requireUsername: true,
} as const

export const EmailAndUsernameFieldSection: React.FC = () => {
  const { t } = useTranslation()
  const tFn = t as TFunction

  return (
    <Section
      fullWidth
      id="email-username-field"
      selectedComponent="email-username-field"
      title="Email & Username Fields"
    >
      <VariantRow label="Email + Username">
        <Variant>
          <Form initialState={bothDefault}>
            <EmailAndUsernameFields loginWithUsername={loginWithBoth} readOnly={false} t={tFn} />
          </Form>
        </Variant>
        <Variant>
          <Form initialState={bothWithValue}>
            <EmailAndUsernameFields loginWithUsername={loginWithBoth} readOnly={false} t={tFn} />
          </Form>
        </Variant>
        <Variant>
          <Form initialState={bothError} submitted>
            <EmailAndUsernameFields loginWithUsername={loginWithBoth} readOnly={false} t={tFn} />
          </Form>
        </Variant>
      </VariantRow>

      <VariantRow label="Email Only">
        <Variant>
          <Form initialState={emailDefault}>
            <EmailAndUsernameFields readOnly={false} t={tFn} />
          </Form>
        </Variant>
        <Variant>
          <Form initialState={emailWithValue}>
            <EmailAndUsernameFields readOnly={false} t={tFn} />
          </Form>
        </Variant>
        <Variant>
          <Form initialState={emailError} submitted>
            <EmailAndUsernameFields readOnly={false} t={tFn} />
          </Form>
        </Variant>
      </VariantRow>

      <VariantRow label="Username Only">
        <Variant>
          <Form initialState={usernameDefault}>
            <EmailAndUsernameFields
              loginWithUsername={loginWithUsernameOnly}
              readOnly={false}
              t={tFn}
            />
          </Form>
        </Variant>
        <Variant>
          <Form initialState={usernameWithValue}>
            <EmailAndUsernameFields
              loginWithUsername={loginWithUsernameOnly}
              readOnly={false}
              t={tFn}
            />
          </Form>
        </Variant>
        <Variant>
          <Form initialState={usernameError} submitted>
            <EmailAndUsernameFields
              loginWithUsername={loginWithUsernameOnly}
              readOnly={false}
              t={tFn}
            />
          </Form>
        </Variant>
      </VariantRow>
    </Section>
  )
}
