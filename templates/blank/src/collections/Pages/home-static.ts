import type { Page } from '@/payload-types'

// @ts-expect-error: This is used for pre-seeded content so that the homepage is not empty
export const homeStatic: Page = {
  slug: 'home',
  title: 'Home',
  layout: [
    {
      blockName: 'Content Block',
      blockType: 'content',
      richText: {
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
                  text: 'This is a static home page.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'p',
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
}
