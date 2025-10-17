import { flattenAllFields, SanitizedConfig } from '..'
import { unwrapLocalizedDoc } from './unwrapLocalizedDoc.js'
const config = {} as SanitizedConfig

const fields = flattenAllFields({
  fields: [
    {
      type: 'text',
      name: 'text',
      localized: true,
    },
    {
      type: 'number',
      name: 'number',
      localized: true,
    },
    {
      type: 'array',
      name: 'array',
      localized: true,
      fields: [
        {
          type: 'text',
          name: 'text',
        },
      ],
    },
    {
      type: 'array',
      name: 'arrayWithLocalized',
      fields: [
        {
          type: 'text',
          name: 'text',
          localized: true,
        },
      ],
    },
  ],
})

describe('unwrapLocalizedDoc', () => {
  it('should unwrap', () => {
    expect(
      unwrapLocalizedDoc({
        config,
        fields,
        locale: 'de',
        doc: {
          text: {
            en: 'en text',
            de: 'de text',
          },
          array: {
            en: [
              {
                text: 'en text',
              },
            ],
            de: [
              {
                text: 'de text',
              },
            ],
          },
          arrayWithLocalized: [
            {
              text: {
                en: 'en text',
                de: 'de text in array',
              },
            },
          ],
        },
      }),
    ).toEqual({
      text: 'de text',
      array: [{ text: 'de text' }],
      arrayWithLocalized: [
        {
          text: 'de text in array',
        },
      ],
    })
  })
})
