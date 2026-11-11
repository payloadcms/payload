'use client'

import type { FormState } from 'payload'

import { useForm, useFormFields } from '@payloadcms/ui'

export function ErrorResponseObserver() {
  const { submit } = useForm()
  const errorPaths = useFormFields(([fields]) =>
    Object.entries(fields)
      .filter(([, field]) => field.valid === false)
      .map(([path]) => path)
      .join(', '),
  )

  return (
    <>
      <output aria-label="Server error paths">{errorPaths}</output>
      <button
        onClick={() =>
          void submit({
            // @ts-expect-error -- Function overrides return values at runtime; the existing type declares FormData.
            overrides: (fields: FormState) => ({
              validateUsingEvent: `${typeof fields.title?.value === 'string' ? fields.title.value : ''} override`,
            }),
          })
        }
        type="button"
      >
        Save with current title
      </button>
    </>
  )
}
