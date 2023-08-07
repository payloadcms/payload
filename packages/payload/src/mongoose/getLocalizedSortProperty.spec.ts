import { Config } from '../config/types';
import { getLocalizedSortProperty } from './getLocalizedSortProperty';

const config = {
  localization: {
    locales: ['en', 'es'],
  },
} as Config;

describe('get localized sort property', () => {
  it('passes through a non-localized sort property', () => {
    const result = getLocalizedSortProperty({
      segments: ['title'],
      config,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      locale: 'en',
    });

    expect(result).toStrictEqual('title');
  });

  it('properly localizes an un-localized sort property', () => {
    const result = getLocalizedSortProperty({
      segments: ['title'],
      config,
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
      locale: 'en',
    });

    expect(result).toStrictEqual('title.en');
  });

  it('keeps specifically asked-for localized sort properties', () => {
    const result = getLocalizedSortProperty({
      segments: ['title', 'es'],
      config,
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
      ],
      locale: 'en',
    });

    expect(result).toStrictEqual('title.es');
  });

  it('properly localizes nested sort properties', () => {
    const result = getLocalizedSortProperty({
      segments: ['group', 'title'],
      config,
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
      locale: 'en',
    });

    expect(result).toStrictEqual('group.title.en');
  });

  it('keeps requested locale with nested sort properties', () => {
    const result = getLocalizedSortProperty({
      segments: ['group', 'title', 'es'],
      config,
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
      locale: 'en',
    });

    expect(result).toStrictEqual('group.title.es');
  });

  it('properly localizes field within row', () => {
    const result = getLocalizedSortProperty({
      segments: ['title'],
      config,
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
      locale: 'en',
    });

    expect(result).toStrictEqual('title.en');
  });

  it('properly localizes field within named tab', () => {
    const result = getLocalizedSortProperty({
      segments: ['tab', 'title'],
      config,
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
      locale: 'en',
    });

    expect(result).toStrictEqual('tab.title.en');
  });

  it('properly localizes field within unnamed tab', () => {
    const result = getLocalizedSortProperty({
      segments: ['title'],
      config,
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab',
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
      locale: 'en',
    });

    expect(result).toStrictEqual('title.en');
  });
});
