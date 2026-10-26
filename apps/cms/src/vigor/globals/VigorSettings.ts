import type { Field, GlobalConfig, TextFieldSingleValidation } from 'payload'

import { text } from 'payload/shared'

import { linkField, requiredInEnglish } from '../fields'
import { revalidateVigorGlobal } from '../revalidate'

/** A social media page: a full address, or empty to leave the link out */
const socialField = ({ label, name }: { label: string; name: string }): Field => ({
  name,
  type: 'text',
  admin: {
    placeholder: 'https://',
  },
  label,
  validate: ((value, options) =>
    !value || /^https:\/\/\S+$/.test(value)
      ? text(value, options)
      : 'Use the full address, starting with https://') satisfies TextFieldSingleValidation,
})

/**
 * Company details, main menu and key figures of the Vigor website. The website shows the company details in the top
 * bar, the footer and on the Contact page, and its AI assistant knows them. Optional fields left empty are left out
 * there.
 */
export const VigorSettings: GlobalConfig = {
  slug: 'vigor-settings',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Vigor website',
  },
  fields: [
    {
      name: 'company',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'shortName',
              type: 'text',
              admin: {
                description: 'Used in "Ask Vigor AI".',
              },
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'portalName',
              type: 'text',
              admin: {
                description: 'Shown under the logo, e.g. Online Wholesale Portal',
              },
              localized: true,
            },
            {
              name: 'tagline',
              type: 'text',
              admin: {
                description: 'Shown in the top bar and the footer.',
              },
              localized: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'email',
              type: 'email',
              admin: {
                description:
                  "Shown in the footer and on the Contact page. The contact form's messages go here too, unless the website's CONTACT_EMAIL_TO says otherwise.",
              },
              required: true,
            },
            {
              name: 'phone',
              type: 'text',
              admin: {
                description:
                  'With the country code, e.g. +852 2123 4567. Shown in the top bar, the footer and on the Contact page.',
              },
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'whatsapp',
              type: 'text',
              admin: {
                description:
                  'The WhatsApp number with the country code, e.g. +852 9123 4567. Buyers get a "WhatsApp" link that opens a chat with it.',
              },
              label: 'WhatsApp',
              validate: ((value, options) =>
                !value || (/^\+[\d\s()-]+$/.test(value) && value.replace(/\D/g, '').length >= 8)
                  ? text(value, options)
                  : 'Start with + and the country code, e.g. +852 9123 4567') satisfies TextFieldSingleValidation,
            },
            {
              name: 'wechat',
              type: 'text',
              admin: {
                description:
                  'The WeChat ID buyers search for to add you. Shown in the footer and on the Contact page.',
              },
              label: 'WeChat ID',
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'address',
              type: 'text',
              admin: {
                description:
                  'The showroom. Shown in the footer and on the Contact page, with a map.',
              },
              localized: true,
            },
            {
              name: 'hours',
              type: 'text',
              admin: {
                description: 'e.g. Monday to Friday, 9:00 am to 6:00 pm',
              },
              label: 'Opening hours',
              localized: true,
            },
          ],
        },
        {
          name: 'social',
          type: 'group',
          admin: {
            description: 'Links in the footer. Leave a field empty to leave its link out.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                socialField({ name: 'linkedin', label: 'LinkedIn URL' }),
                socialField({ name: 'instagram', label: 'Instagram URL' }),
              ],
            },
            {
              type: 'row',
              fields: [
                socialField({ name: 'facebook', label: 'Facebook URL' }),
                socialField({ name: 'youtube', label: 'YouTube URL' }),
              ],
            },
          ],
          label: 'Social media',
        },
      ],
    },
    {
      name: 'nav',
      type: 'array',
      admin: {
        description: '"Home" is added automatically.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
              validate: requiredInEnglish(text),
            },
            linkField({ name: 'link', label: 'Link' }),
          ],
        },
      ],
      label: 'Main menu',
    },
    {
      name: 'stats',
      type: 'array',
      admin: {
        description: 'Shown on the home and About pages.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              admin: {
                description: 'e.g. 25+',
              },
              required: true,
            },
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
              validate: requiredInEnglish(text),
            },
          ],
        },
      ],
      label: 'Key figures',
    },
  ],
  hooks: {
    afterChange: [revalidateVigorGlobal],
  },
  label: 'Site settings',
  typescript: {
    interface: 'VigorSettings',
  },
}
