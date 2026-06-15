import type { Block, CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  lexicalEditor,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { createTagField } from 'payload'

import { tagsSlug, talksSlug, uploadsSlug } from '../../slugs.js'

const heroBlock: Block = {
  slug: 'talk-hero',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
  ],
}

const quoteBlock: Block = {
  slug: 'talk-quote',
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'attribution', type: 'text' },
    { name: 'role', type: 'text' },
  ],
}

const ctaBlock: Block = {
  slug: 'talk-cta',
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      options: ['primary', 'secondary', 'ghost'],
    },
  ],
}

const imageWithCaptionBlock: Block = {
  slug: 'talk-image',
  fields: [
    { name: 'image', type: 'upload', relationTo: uploadsSlug, required: true },
    { name: 'caption', type: 'text' },
    {
      name: 'align',
      type: 'radio',
      defaultValue: 'center',
      options: ['left', 'center', 'right'],
    },
  ],
}

const qaBlock: Block = {
  slug: 'talk-qa',
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Q&A' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
      minRows: 1,
    },
  ],
}

const Talks: CollectionConfig = {
  slug: talksSlug,
  admin: {
    defaultColumns: ['title', 'track', 'startTime', 'status', '_status', 'updatedAt'],
    group: 'Showcase',
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          description: 'The headline content for this talk.',
          fields: [
            {
              name: 'title',
              type: 'text',
              admin: { description: 'Public-facing title of the talk.' },
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              admin: { description: 'URL slug — leave blank to auto-generate.' },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              admin: { description: 'One-paragraph teaser shown in listings.' },
            },
            {
              name: 'abstract',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  FixedToolbarFeature(),
                  UploadFeature({
                    collections: {
                      [uploadsSlug]: {
                        fields: [{ name: 'caption', type: 'text' }],
                      },
                    },
                  }),
                  BlocksFeature({
                    blocks: [
                      {
                        slug: 'callout',
                        fields: [
                          {
                            name: 'style',
                            type: 'select',
                            defaultValue: 'info',
                            options: ['info', 'warning', 'success', 'error'],
                          },
                          { name: 'body', type: 'textarea', required: true },
                        ],
                      },
                    ],
                    inlineBlocks: [
                      {
                        slug: 'kbd',
                        fields: [{ name: 'keys', type: 'text', required: true }],
                      },
                    ],
                  }),
                ],
              }),
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'track',
                  type: 'select',
                  defaultValue: 'frontend',
                  options: [
                    { label: 'Frontend', value: 'frontend' },
                    { label: 'Backend', value: 'backend' },
                    { label: 'DevOps', value: 'devops' },
                    { label: 'Design', value: 'design' },
                    { label: 'AI / ML', value: 'ai-ml' },
                    { label: 'Workshop', value: 'workshop' },
                  ],
                },
                {
                  name: 'durationMinutes',
                  type: 'number',
                  admin: { description: 'Total runtime in minutes.' },
                  defaultValue: 30,
                  max: 240,
                  min: 5,
                },
              ],
            },
            {
              name: 'difficultyLevel',
              type: 'radio',
              defaultValue: 'beginner',
              options: [
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' },
              ],
            },
            {
              name: 'languages',
              type: 'select',
              defaultValue: ['en'],
              hasMany: true,
              options: [
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'German', value: 'de' },
                { label: 'French', value: 'fr' },
                { label: 'Japanese', value: 'ja' },
                { label: 'Portuguese', value: 'pt' },
              ],
            },
            {
              name: 'keywords',
              type: 'text',
              admin: { description: 'Keywords for search and discoverability.' },
              hasMany: true,
            },
          ],
          label: 'Overview',
        },
        {
          description: 'When and where the talk happens.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'startTime',
                  type: 'date',
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
                {
                  name: 'endTime',
                  type: 'date',
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'room', type: 'text', admin: { description: 'Room or stage name.' } },
                {
                  name: 'capacity',
                  type: 'number',
                  admin: { description: 'Maximum seats.' },
                  defaultValue: 100,
                  min: 0,
                },
              ],
            },
            {
              name: 'venueLocation',
              type: 'point',
              admin: { description: 'Geographic coordinates of the venue.' },
            },
            {
              type: 'collapsible',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'registrationDeadline',
                  type: 'date',
                  admin: { date: { pickerAppearance: 'dayOnly' } },
                },
                { name: 'registrationUrl', type: 'text' },
                { name: 'contactEmail', type: 'email' },
              ],
              label: 'Registration',
            },
          ],
          label: 'Schedule',
        },
        {
          description: 'Hero image, slides, recording, and gallery.',
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              admin: { description: 'Wide image used on the talk landing page.' },
              relationTo: uploadsSlug,
            },
            {
              type: 'row',
              fields: [
                { name: 'slidesUrl', type: 'text', label: 'Slides URL' },
                { name: 'recordingUrl', type: 'text', label: 'Recording URL' },
              ],
            },
            {
              name: 'gallery',
              type: 'array',
              admin: { description: 'Photos and graphics for the talk.' },
              fields: [
                { name: 'image', type: 'upload', relationTo: uploadsSlug, required: true },
                { name: 'caption', type: 'text' },
              ],
            },
          ],
          label: 'Media',
        },
        {
          description: 'Composable sections shown on the talk page.',
          fields: [
            {
              name: 'sections',
              type: 'blocks',
              blocks: [heroBlock, quoteBlock, ctaBlock, imageWithCaptionBlock, qaBlock],
              labels: { plural: 'Sections', singular: 'Section' },
            },
            {
              name: 'resources',
              type: 'array',
              admin: { description: 'Links to slides, recording, docs, code.' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
                {
                  name: 'type',
                  type: 'select',
                  defaultValue: 'docs',
                  options: ['slides', 'recording', 'docs', 'code', 'other'],
                },
              ],
            },
          ],
          label: 'Content',
        },
        {
          description: 'Search engine and social sharing metadata.',
          fields: [
            {
              type: 'collapsible',
              admin: { initCollapsed: false },
              fields: [
                { name: 'metaTitle', type: 'text' },
                { name: 'metaDescription', type: 'textarea' },
                { name: 'ogImage', type: 'upload', label: 'OG Image', relationTo: uploadsSlug },
              ],
              label: 'Meta',
            },
          ],
          label: 'SEO',
        },
        {
          description: 'Power-user settings.',
          fields: [
            {
              name: 'customCss',
              type: 'code',
              admin: { language: 'css' },
              label: 'Custom CSS',
            },
            {
              name: 'customSchema',
              type: 'json',
              admin: { description: 'JSON-LD schema injected into the page head.' },
            },
            {
              name: 'internalNotes',
              type: 'group',
              admin: { description: 'Notes visible only to organizers.' },
              fields: [
                { name: 'reviewerNotes', type: 'textarea' },
                { name: 'flagged', type: 'checkbox', label: 'Flag for review' },
              ],
            },
          ],
          label: 'Advanced',
        },
      ],
    },
    {
      name: 'relatedTalks',
      type: 'relationship',
      admin: { description: 'Other talks attendees might enjoy.' },
      hasMany: true,
      relationTo: talksSlug,
    },
    {
      name: 'referencedBy',
      type: 'join',
      admin: { description: 'Talks that list this one as related.' },
      collection: talksSlug,
      on: 'relatedTalks',
    },

    // ──────── Sidebar ────────
    {
      name: 'status',
      type: 'select',
      admin: {
        description: 'Workflow status (separate from publish state).',
        position: 'sidebar',
      },
      defaultValue: 'proposed',
      options: [
        { label: 'Proposed', value: 'proposed' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'organizer',
      type: 'relationship',
      admin: { description: 'Primary owner of this talk.', position: 'sidebar' },
      relationTo: 'users',
    },
    {
      name: 'coOrganizers',
      type: 'relationship',
      admin: { position: 'sidebar' },
      hasMany: true,
      relationTo: 'users',
    },
    createTagField({
      admin: { description: 'Hierarchical tags.', position: 'sidebar' },
      relationTo: tagsSlug,
    }),
    {
      name: 'isFeatured',
      type: 'checkbox',
      admin: { position: 'sidebar' },
      label: 'Featured',
    },
    {
      name: 'isVirtual',
      type: 'checkbox',
      admin: { position: 'sidebar' },
      label: 'Virtual event',
    },
    {
      name: 'attendeeCount',
      type: 'number',
      admin: { description: 'Current registered attendees.', position: 'sidebar' },
      defaultValue: 0,
    },
    {
      name: 'priority',
      type: 'number',
      admin: { description: 'Sort priority (1–10).', position: 'sidebar' },
      defaultValue: 5,
      max: 10,
      min: 1,
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 800,
      },
    },
    maxPerDoc: 25,
  },
}

export default Talks
