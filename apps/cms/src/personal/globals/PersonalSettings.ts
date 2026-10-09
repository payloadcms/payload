import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { text } from 'payload/shared'

import { revalidateWebsiteGlobal } from '../../hooks/revalidateWebsite'
import { isLink, personalWebsiteGroup } from '../fields'
import { menuIcons, socialPlatforms } from '../options'

const validateMenuLink: TextFieldSingleValidation = (value, options) =>
  !value || isLink(value)
    ? text(value, options)
    : 'Use a page of the website such as /about, or a full URL such as https://…'

const validateSocialURL: TextFieldSingleValidation = (value, options) =>
  !value || /^(?:https?:\/\/|mailto:)\S+$/.test(value)
    ? text(value, options)
    : 'Enter a full URL, e.g. https://github.com/you, or mailto:you@example.com for email.'

/**
 * The personal website's name, defaults for search engines, main menu and social links. Until it's
 * saved, the website uses the values in its theme.config.js.
 */
export const PersonalSettings: GlobalConfig = {
  slug: 'personal-settings',
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
            {
              type: 'row',
              fields: [
                {
                  name: 'siteName',
                  type: 'text',
                  admin: {
                    description: 'e.g. your name. Shown in link previews and the RSS feed.',
                  },
                  required: true,
                },
                {
                  name: 'authorName',
                  type: 'text',
                  admin: {
                    description: 'The author of blog posts. Empty: the site name.',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'defaultTitle',
                  type: 'text',
                  admin: {
                    description: 'Browser tab title of pages without their own SEO title.',
                  },
                  required: true,
                },
                {
                  name: 'titleTemplate',
                  type: 'text',
                  admin: {
                    description:
                      'Browser tab title of the other pages; %s is replaced by their title, e.g. Oskar Wong | %s',
                  },
                  validate: ((value, options) =>
                    !value || value.includes('%s')
                      ? text(value, options)
                      : 'Include %s where the page title goes.') satisfies TextFieldSingleValidation,
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description:
                  'For search engines and link previews of pages without their own description.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'email',
                  type: 'email',
                  admin: {
                    description: 'Published as the contact address of the RSS feed.',
                  },
                },
                {
                  name: 'twitterHandle',
                  type: 'text',
                  admin: {
                    description: 'Your X (Twitter) username for link previews, e.g. @atropos',
                  },
                  label: 'X handle',
                  validate: ((value, options) =>
                    !value || /^@\w{1,15}$/.test(value)
                      ? text(value, options)
                      : 'Enter the username with @, e.g. @atropos') satisfies TextFieldSingleValidation,
                },
              ],
            },
          ],
          label: 'Site',
        },
        {
          fields: [
            {
              name: 'menu',
              type: 'array',
              admin: {
                description: 'The menu on every page, in this order.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'link',
                      type: 'text',
                      admin: {
                        description: 'e.g. /about',
                      },
                      required: true,
                      validate: validateMenuLink,
                    },
                    {
                      name: 'icon',
                      type: 'select',
                      options: menuIcons,
                      required: true,
                    },
                  ],
                },
              ],
              label: 'Main menu',
              labels: {
                plural: 'Menu items',
                singular: 'Menu item',
              },
            },
            {
              name: 'social',
              type: 'array',
              admin: {
                description: 'Icons under the menu.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      options: socialPlatforms,
                      required: true,
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: 'URL',
                      required: true,
                      validate: validateSocialURL,
                    },
                  ],
                },
              ],
              label: 'Social links',
              labels: {
                plural: 'Social links',
                singular: 'Social link',
              },
            },
          ],
          label: 'Menu',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateWebsiteGlobal],
  },
  label: 'Site settings',
  typescript: {
    interface: 'PersonalSettings',
  },
}
