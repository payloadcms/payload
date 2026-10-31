import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { text } from 'payload/shared'

import { revalidateWebsiteGlobal } from '../../hooks/revalidateWebsite'
import { isLink, pageTitleRow, personalWebsiteGroup, richTextField, seoField } from '../fields'
import { contactDetailTypes } from '../options'

/**
 * The texts of the personal website's Contact page (/contact), shown next to the contact form. The
 * form's questions are in the website repo (content/contact-form.json). Until it's saved, the
 * website shows content/contact.md.
 */
export const PersonalContact: GlobalConfig = {
  slug: 'personal-contact',
  access: {
    read: () => true,
  },
  admin: {
    group: personalWebsiteGroup,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            pageTitleRow({ subtitle: "Let's talk about your project", title: 'Get in touch' }),
            richTextField({ name: 'intro', label: 'Introduction' }),
            {
              name: 'details',
              type: 'array',
              admin: {
                description: 'Shown below the introduction, each with its icon.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'type',
                      type: 'select',
                      options: contactDetailTypes,
                      required: true,
                    },
                    {
                      name: 'label',
                      type: 'text',
                      admin: {
                        description: 'e.g. Phone',
                      },
                    },
                    {
                      name: 'value',
                      type: 'text',
                      admin: {
                        description: 'e.g. (626) 206-3228',
                      },
                      required: true,
                    },
                  ],
                },
                {
                  name: 'link',
                  type: 'text',
                  admin: {
                    description:
                      'Optional, e.g. https://www.linkedin.com/in/you. Email addresses and phone numbers are linked automatically.',
                  },
                  validate: ((value, options) =>
                    !value || isLink(value)
                      ? text(value, options)
                      : 'Enter a full URL, e.g. https://…') satisfies TextFieldSingleValidation,
                },
              ],
              labels: {
                plural: 'Contact details',
                singular: 'Contact detail',
              },
            },
          ],
          label: 'Introduction',
        },
        {
          fields: [seoField],
          label: 'SEO',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateWebsiteGlobal],
  },
  label: 'Contact page',
}
