import type { Config, SanitizedConfig } from 'payload'

import { flattenAllFields, sanitizeConfig } from 'payload'

import { getLocalizedSortProperty } from './getLocalizedSortProperty.js'

let config: SanitizedConfig

describe('get localized sort property', () => {
  beforeAll(async () => {
    config = await sanitizeConfig({
      localization: {
        defaultLocale: 'en',
        fallback: true,
        locales: ['en', 'es'],
      },
    } as Config)
  })
  it('passes through a non-localized sort property', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      locale: 'en',
      segments: ['title'],
    })

    expect(result).toStrictEqual('title')
  })

  it('properly localizes an un-localized sort property', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
      locale: 'en',
      segments: ['title'],
    })

    expect(result).toStrictEqual('title.en')
  })

  it('keeps specifically asked-for localized sort properties', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
      locale: 'en',
      segments: ['title', 'es'],
    })

    expect(result).toStrictEqual('title.es')
  })

  it('properly localizes nested sort properties', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: flattenAllFields({
        fields: [
          {
            name: 'group',
            type: 'group',
            fields: [
              {
                name: 'title',
                type: 'text',
                localized: true,
              },
            ],
          },
        ],
      }),
      locale: 'en',
      segments: ['group', 'title'],
    })

    expect(result).toStrictEqual('group.title.en')
  })

  it('keeps requested locale with nested sort properties', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: flattenAllFields({
        fields: [
          {
            name: 'group',
            type: 'group',
            fields: [
              {
                name: 'title',
                type: 'text',
                localized: true,
              },
            ],
          },
        ],
      }),
      locale: 'en',
      segments: ['group', 'title', 'es'],
    })

    expect(result).toStrictEqual('group.title.es')
  })

  it('properly localizes field within row', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: flattenAllFields({
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'title',
                type: 'text',
                localized: true,
              },
            ],
          },
        ],
      }),
      locale: 'en',
      segments: ['title'],
    })

    expect(result).toStrictEqual('title.en')
  })

  it('properly localizes field within named tab', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: flattenAllFields({
        fields: [
          {
            type: 'tabs',
            tabs: [
              {
                name: 'tab',
                fields: [
                  {
                    name: 'title',
                    type: 'text',
                    localized: true,
                  },
                ],
              },
            ],
          },
        ],
      }),
      locale: 'en',
      segments: ['tab', 'title'],
    })

    expect(result).toStrictEqual('tab.title.en')
  })

  it('properly localizes field within unnamed tab', () => {
    const result = getLocalizedSortProperty({
      config,
      parentIsLocalized: false,
      fields: flattenAllFields({
        fields: [
          {
            type: 'tabs',
            tabs: [
              {
                fields: [
                  {
                    name: 'title',
                    type: 'text',
                    localized: true,
                  },
                ],
                label: 'Tab',
              },
            ],
          },
        ],
      }),
      locale: 'en',
      segments: ['title'],
    })

    expect(result).toStrictEqual('title.en')
  })
})
