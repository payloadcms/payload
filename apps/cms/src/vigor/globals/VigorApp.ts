import type { Field, GlobalConfig, TextFieldSingleValidation } from 'payload'

import { text, textarea } from 'payload/shared'

import { requiredInEnglish } from '../fields'
import { appIcons } from '../options'
import { revalidateVigorGlobal } from '../revalidate'

/**
 * The Vigor website's page about the VgemsAI app (/vgemsai), public so that anyone, App Review
 * included, can open it. The website shows it once it has a title; saving puts it live.
 */
export const VigorApp: GlobalConfig = {
  slug: 'vigor-app',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Vigor website',
  },
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
              required: true,
              validate: requiredInEnglish(text),
            },
            {
              name: 'summary',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'status',
              type: 'text',
              admin: {
                description:
                  'Badge in the banner, e.g. "In development · Public beta on TestFlight". Leave it empty for none.',
              },
              localized: true,
            },
            {
              name: 'image',
              type: 'upload',
              admin: {
                description: 'Banner artwork, at least 1600 × 600 pixels.',
              },
              relationTo: 'media',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'appStoreUrl',
                  type: 'text',
                  admin: {
                    description:
                      'Once the app is on the App Store: its link. The main button then says "Download on the App Store".',
                    width: '50%',
                  },
                  label: 'App Store link',
                  validate: httpsLink,
                },
                {
                  name: 'testFlightUrl',
                  type: 'text',
                  admin: {
                    description:
                      'The public link of the beta (App Store Connect → TestFlight → External Testing → Public Link). Without it, the beta button opens the contact form.',
                    width: '50%',
                  },
                  label: 'TestFlight link',
                  validate: httpsLink,
                },
              ],
            },
            {
              name: 'highlights',
              type: 'array',
              admin: {
                description: 'The short points under the banner, three or four of them.',
              },
              fields: iconTitleText(),
            },
          ],
          label: 'Banner',
        },
        {
          name: 'features',
          fields: [
            sectionTitle(),
            {
              name: 'intro',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'items',
              type: 'array',
              fields: iconTitleText(),
              label: 'Features',
            },
          ],
          label: 'Features',
        },
        {
          name: 'beta',
          fields: [
            sectionTitle(),
            {
              name: 'text',
              type: 'textarea',
              admin: {
                description: 'Where the app is at, and how to join the beta. Separate paragraphs with a blank line.',
              },
              localized: true,
            },
            {
              name: 'steps',
              type: 'array',
              fields: [
                {
                  name: 'text',
                  type: 'textarea',
                  localized: true,
                  required: true,
                  validate: requiredInEnglish(textarea),
                },
              ],
            },
            {
              name: 'note',
              type: 'text',
              admin: {
                description: 'Small print under the steps, e.g. the iOS version the app needs.',
              },
              localized: true,
            },
          ],
          label: 'Beta',
        },
        {
          name: 'faq',
          fields: [
            sectionTitle(),
            {
              name: 'items',
              type: 'array',
              fields: [
                {
                  name: 'question',
                  type: 'text',
                  localized: true,
                  required: true,
                  validate: requiredInEnglish(text),
                },
                {
                  name: 'answer',
                  type: 'textarea',
                  localized: true,
                  required: true,
                  validate: requiredInEnglish(textarea),
                },
              ],
              label: 'Questions',
            },
          ],
          label: 'FAQ',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateVigorGlobal],
  },
  label: 'VgemsAI app page',
}

/** The section's heading on the page */
function sectionTitle(): Field {
  return {
    name: 'title',
    type: 'text',
    localized: true,
  }
}

/** A highlight or feature: an icon, a short title and a sentence or two */
function iconTitleText(): Field[] {
  return [
    {
      type: 'row',
      fields: [
        {
          name: 'icon',
          type: 'select',
          admin: {
            width: '30%',
          },
          defaultValue: 'assistant',
          options: appIcons,
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          admin: {
            width: '70%',
          },
          localized: true,
          required: true,
          validate: requiredInEnglish(text),
        },
      ],
    },
    {
      name: 'text',
      type: 'textarea',
      localized: true,
      required: true,
      validate: requiredInEnglish(textarea),
    },
  ]
}

/** Empty, or an https:// address */
function httpsLink(...[value, options]: Parameters<TextFieldSingleValidation>) {
  return !value || /^https:\/\/\S+$/.test(value)
    ? text(value, options)
    : 'Use an address that starts with https://'
}
