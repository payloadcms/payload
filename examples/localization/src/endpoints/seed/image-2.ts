import type { Media } from '@/payload-types'

export const image2 = (locale: 'en' | 'es'): Omit<Media, 'createdAt' | 'id' | 'updatedAt'> => ({
  alt:
    locale === 'en'
      ? 'Curving abstract shapes with an orange and blue gradient'
      : 'Formas abstractas curvas con un gradiente naranja y azul',
  caption: {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: locale === 'en' ? 'Photo by ' : 'Fotografía por ',
              version: 1,
            },
            {
              type: 'link',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Andrew Kliatskyi',
                  version: 1,
                },
              ],
              direction: 'ltr',
              fields: {
                linkType: 'custom',
                newTab: true,
                url: 'https://unsplash.com/@kirp',
              },
              format: '',
              indent: 0,
              version: 2,
            },
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: locale === 'en' ? ' on Unsplash.' : ' en Unsplash.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
})
