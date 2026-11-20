import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { Context } from '../Form/types.js'
import type { Options } from './types.js'

import { DocumentFormContext, FormContext } from '../Form/context.js'
import { useField } from './index.js'

const { validationEffectRan } = vi.hoisted(() => ({ validationEffectRan: vi.fn() }))

vi.mock('../../hooks/useThrottledEffect.js', async () => {
  const { useEffect } = await import('react')

  return {
    useThrottledEffect: (effect: () => void) => {
      useEffect(() => {
        effect()
        validationEffectRan()
      }, [effect])
    },
  }
})

vi.mock('../../providers/Auth/index.js', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../../providers/Config/index.js', () => ({ useConfig: () => ({ config: {} }) }))
vi.mock('../../providers/DocumentInfo/index.js', () => ({ useDocumentInfo: () => ({}) }))
vi.mock('../../providers/Translation/index.js', () => ({ useTranslation: () => ({}) }))

function Field({ validate }: { validate?: Options['validate'] }) {
  useField({ path: 'title', validate })

  return null
}

test('should skip reading form data when the field has no validator', async () => {
  validationEffectRan.mockClear()
  const getData = vi.fn(() => ({}))

  await render(
    <FormContext.Provider value={{ getData } as Context}>
      <Field />
    </FormContext.Provider>,
  )

  await expect.poll(() => validationEffectRan.mock.calls.length).toBeGreaterThan(0)
  expect(getData).not.toHaveBeenCalled()
})

test.each([false, true])(
  'should read validation data from only the applicable form (nested: %s)',
  async (nested) => {
    const formData = { title: 'Nested form' }
    const documentData = { title: 'Document' }
    const getData = vi.fn(() => formData)
    const getDocumentData = vi.fn(() => documentData)
    const getSiblingData = vi.fn(() => ({ subtitle: 'Sibling' }))
    const validate = vi.fn(() => true)

    await render(
      <DocumentFormContext.Provider value={(nested ? { getData: getDocumentData } : {}) as Context}>
        <FormContext.Provider value={{ getData, getSiblingData } as Context}>
          <Field validate={validate} />
        </FormContext.Provider>
      </DocumentFormContext.Provider>,
    )

    await expect.poll(() => validate.mock.calls.length).toBeGreaterThan(0)
    expect(validate).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        data: nested ? documentData : formData,
        siblingData: { subtitle: 'Sibling' },
      }),
    )
    expect(getData).toHaveBeenCalledTimes(nested ? 0 : validate.mock.calls.length)
    expect(getDocumentData).toHaveBeenCalledTimes(nested ? validate.mock.calls.length : 0)
  },
)
