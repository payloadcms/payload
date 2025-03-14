import fieldSchemasToFormState from './index.js'

describe('Form - fieldSchemasToFormState', () => {
  const defaultValue = 'Default'
  it('populates default value - normal fields', async () => {
    const fieldSchema = [
      {
        name: 'text',
        type: 'text',
        defaultValue,
        label: 'Text',
      },
    ]
    const state = await fieldSchemasToFormState({ fields: fieldSchema })
    expect(state.text.value).toBe(defaultValue)
  })
  it('field value overrides defaultValue - normal fields', async () => {
    const value = 'value'
    const data = { text: value }
    const fieldSchema = [
      {
        name: 'text',
        type: 'text',
        defaultValue,
        label: 'Text',
      },
    ]
    const state = await fieldSchemasToFormState({ data, fields: fieldSchema })
    expect(state.text.value).toBe(value)
  })
  it('populates default value from a function - normal fields', async () => {
    const user = { email: 'user@example.com' }
    const locale = 'en'
    const fieldSchema = [
      {
        name: 'text',
        type: 'text',
        defaultValue: (args) => {
          if (!args.locale) {
            return 'missing locale'
          }
          if (!args.user) {
            return 'missing user'
          }
          return 'Default'
        },
        label: 'Text',
      },
    ]
    const state = await fieldSchemasToFormState({ fields: fieldSchema, locale, user })
    expect(state.text.value).toBe(defaultValue)
  })
})
