import type { Block } from 'payload'

import { richTextField } from '../fields/richText.js'
import { blockOptions } from './blockOptions.js'

const buildHero: (index: number) => Block = (index) => ({
  slug: `Hero${index}`,
  interfaceName: `Hero${index}Block`,
  labels: {
    singular: `Hero${index}`,
    plural: `Heroes${index}`,
  },
  fields: [
    {
      label: 'Images',
      type: 'collapsible',
      fields: [
        {
          name: 'images',
          interfaceName: 'HeroImages',
          label: false,
          type: 'group',
          fields: [
            {
              label: 'Small',
              type: 'collapsible',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'small',
                  label: false,
                  interfaceName: 'SmallHeroImages',
                  type: 'group',
                  fields: [
                    {
                      name: 'background',
                      type: 'upload',
                      relationTo: 'media',
                    },
                    {
                      name: 'icon',
                      type: 'upload',
                      relationTo: 'media',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Medium',
              type: 'collapsible',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'medium',
                  label: false,
                  interfaceName: 'MediumHeroImages',
                  type: 'group',
                  fields: [
                    {
                      name: 'background',
                      type: 'upload',
                      relationTo: 'media',
                    },
                    {
                      name: 'icon',
                      type: 'upload',
                      relationTo: 'media',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Large',
              type: 'collapsible',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'large',
                  label: false,
                  interfaceName: 'LargeHeroImages',
                  type: 'group',
                  fields: [
                    {
                      name: 'background',
                      type: 'upload',
                      relationTo: 'media',
                    },
                    {
                      name: 'icon',
                      type: 'upload',
                      relationTo: 'media',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      admin: { initCollapsed: true, hidden: false },
    },
    {
      type: 'row',
      fields: [richTextField({ name: 'header' }), richTextField({ name: 'subheader' })],
    },
    richTextField({ name: 'text' }),
    {
      name: 'buttons',
      type: 'array',
      interfaceName: 'DynamicButton',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'dynamic', type: 'checkbox' },
            { name: 'newTab', label: 'Open in new tab', type: 'checkbox' },
          ],
        },
        {
          type: 'row',
          fields: [
            richTextField({ name: 'label' }),
            {
              name: 'link',
              type: 'text',
              admin: { condition: (_, siblingData) => !siblingData?.dynamic },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'select',
              options: [
                {
                  label: 'Nearest Store - Phone Number',
                  value: 'nearestPhoneNumber',
                },
                {
                  label: 'Regional Manager - Phone Number',
                  value: 'regionalManagerPhoneNumber',
                },
              ],
              admin: {
                condition: (_, siblingData) => siblingData?.dynamic,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'buttonAlignment',
      type: 'select',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'default',
    },
    {
      label: 'Settings',
      type: 'collapsible',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              type: 'select',
              options: [
                { label: 'Standard', value: 'standard' },
                { label: 'Glass', value: 'glass' },
                { label: 'Glass Pane', value: 'glassPane' },
                { label: 'Stretch', value: 'stretch' },
                { label: 'Icon', value: 'icon' },
              ],
              admin: {
                hidden: true,
              },
            },
            {
              name: 'style',
              type: 'select',
              options: [
                { label: 'Gradient', value: 'gradient' },
                { label: 'Blur', value: 'blur' },
                { label: 'Glass', value: 'glass' },
                { label: 'Home', value: 'home' },
                { label: 'Footer', value: 'footer' },
                { label: 'Footer Askew', value: 'footerAskew' },
              ],
              defaultValue: 'gradient',
            },
            {
              name: 'aspectRatio',
              type: 'select',
              options: [
                { label: 'Mini', value: 'mini' },
                { label: 'Short', value: 'short' },
                { label: 'Tall', value: 'tall' },
              ],
              defaultValue: 'short',
              admin: {
                description:
                  'Decides aspects for laptop - tablet - phone. Short is 32/9 - 2/3 - 9/8, Tall is 16/9 - 4/3 - 9/16',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'centerOverlay',
              type: 'checkbox',
            },
            {
              name: 'overlayMaxHeight',
              type: 'group',
              interfaceName: 'OverlayMaxHeight',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'small', type: 'text' },
                    { name: 'medium', type: 'text' },
                    { name: 'large', type: 'text' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'gradientDirection',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'small',
                      type: 'select',
                      options: [
                        { label: 'Left', value: 'l' },
                        { label: 'Right', value: 'r' },
                        { label: 'Top', value: 't' },
                        { label: 'Bottom', value: 'b' },
                        { label: 'Top Left', value: 'tl' },
                        { label: 'Top Right', value: 'tr' },
                        { label: 'Bottom Left', value: 'bl' },
                        { label: 'Bottom Right', value: 'br' },
                      ],
                    },
                    {
                      name: 'medium',
                      type: 'select',
                      options: [
                        { label: 'Left', value: 'l' },
                        { label: 'Right', value: 'r' },
                        { label: 'Top', value: 't' },
                        { label: 'Bottom', value: 'b' },
                        { label: 'Top Left', value: 'tl' },
                        { label: 'Top Right', value: 'tr' },
                        { label: 'Bottom Left', value: 'bl' },
                        { label: 'Bottom Right', value: 'br' },
                      ],
                    },
                    {
                      name: 'large',
                      type: 'select',
                      options: [
                        { label: 'Left', value: 'l' },
                        { label: 'Right', value: 'r' },
                        { label: 'Top', value: 't' },
                        { label: 'Bottom', value: 'b' },
                        { label: 'Top Left', value: 'tl' },
                        { label: 'Top Right', value: 'tr' },
                        { label: 'Bottom Left', value: 'bl' },
                        { label: 'Bottom Right', value: 'br' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          admin: {
            condition: (_, siblingData) => siblingData?.style === 'gradient',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'alignment',
              type: 'select',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              defaultValue: 'left',
            },
            {
              name: 'wideRounding',
              type: 'select',
              hasMany: false,
              options: [
                { label: 'None', value: 'none' },
                { label: 'Top', value: 'wide_rounded_t' },
                { label: 'Bottom', value: 'wide_rounded_b' },
                { label: 'Both', value: 'wide_rounded' },
              ],
              defaultValue: 'wide_rounded_b',
              admin: { hidden: true },
            },
            {
              name: 'rounding',
              type: 'select',
              hasMany: false,
              options: [
                { label: 'None', value: 'none' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
                { label: 'Both', value: 'rounded' },
              ],
              defaultValue: 'bottom',
            },
          ],
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
          defaultValue: 'active',
          admin: {
            description: 'Set to Inactive to hide from the homepage slider.',
          },
        },
      ],
      admin: { initCollapsed: true },
    },
    blockOptions,
  ],
})

export const generateHeroBlocks = (count: number) =>
  Array.from({ length: count }).map((_, index) => buildHero(index + 1))
