import type { Page } from '@/payload-types'

export const contact = (locale: 'en' | 'es'): Partial<Page> => ({
  slug: 'contact',
  slugLock: false,
  _status: 'published',
  hero: {
    type: 'none',
  },
  layout: [
    {
      blockType: 'formBlock',
      enableIntro: true,
      // @ts-ignore
      form: '{{CONTACT_FORM_ID}}',
      introContent: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text:
                    locale === 'en'
                      ? 'Example contact form:'
                      : 'Formulario de contacto de ejemplo:',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h3',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    },
  ],
  title: locale === 'en' ? 'Contact' : 'Contacto',
})
