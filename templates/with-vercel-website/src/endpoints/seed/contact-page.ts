import type { Form } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export type contactParameters = {
  contactForm: Form
}

export const contact: ({
  contactForm,
}: contactParameters) => RequiredDataFromCollectionSlug<'pages'> = ({
  contactForm,
}: contactParameters): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'contact',
    _status: 'published',
    hero: {
      type: 'none',
    },
    layout: [
      {
        blockType: 'formBlock',
        enableIntro: true,
        form: contactForm,
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
}
