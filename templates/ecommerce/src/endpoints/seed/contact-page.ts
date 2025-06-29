import type { Page } from '@/payload-types'

export const contact: Partial<Page> = {
  slug: 'contact',
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
                  text: 'Example contact form:',
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
  title: 'Contact',
}
