import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'

import { buildEditorState } from '@payloadcms/richtext-lexical'

import type { Page } from '../payload-types.js'

import { postsSlug } from '../shared.js'

export const home: Omit<Page, 'createdAt' | 'id' | 'updatedAt'> = {
  slug: 'home',
  title: 'Home',
  meta: {
    description: 'This is an example of live preview on a page.',
  },
  tenant: '{{TENANT_1_ID}}',
  localizedTitle: 'Localized Title',
  hero: {
    type: 'highImpact',
    richText: buildEditorState<DefaultNodeTypes>({
      nodes: [
        {
          type: 'heading',
          tag: 'h1',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Hello, world!',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'This is an example of live preview on a page. You can edit this page in the admin panel and see the changes reflected here.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
        },
      ],
    }),
    media: '{{MEDIA_ID}}',
  },
  layout: [
    {
      blockType: 'archive',
      populateBy: 'selection',
      selectedDocs: [
        {
          relationTo: postsSlug,
          value: '{{POST_1_ID}}',
        },
        {
          relationTo: postsSlug,
          value: '{{POST_2_ID}}',
        },
        {
          relationTo: postsSlug,
          value: '{{POST_3_ID}}',
        },
      ],
      introContent: buildEditorState<DefaultNodeTypes>({
        nodes: [
          {
            type: 'heading',
            tag: 'h2',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Recent Posts',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'This is a custom layout building block. You can edit this block in the admin panel and see the changes reflected here.',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            version: 1,
          },
        ],
      }),
    },
    {
      blockType: 'cta',
      blockName: 'CTA',
      richText: buildEditorState<DefaultNodeTypes>({
        nodes: [
          {
            type: 'heading',
            tag: 'h4',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'This is a call to action',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'This is a custom layout building block. You can edit this block in the admin panel and see the changes reflected here.',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            version: 1,
          },
        ],
      }),
      links: [
        {
          link: {
            type: 'reference',
            url: '',
            label: 'All posts',
            appearance: 'primary',
            reference: {
              value: '{{POSTS_PAGE_ID}}',
              relationTo: 'pages',
            },
          },
        },
      ],
    },
  ],
  relationshipAsUpload: '{{MEDIA_ID}}',
  richTextLexical: {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          format: '',
          type: 'relationship',
          version: 1,
          relationTo: postsSlug,
          value: {
            id: '{{POST_1_ID}}',
          },
        },
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
        {
          format: '',
          type: 'upload',
          version: 1,
          fields: null,
          relationTo: 'media',
          value: {
            id: '{{MEDIA_ID}}',
          },
        },
      ],
      direction: null,
    },
  },
  richTextLexicalLocalized: {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
        {
          format: '',
          type: 'upload',
          version: 1,
          fields: null,
          relationTo: 'media',
          value: {
            id: '{{MEDIA_ID}}',
          },
        },
      ],
      direction: null,
    },
  },
  relationshipMonoHasMany: ['{{POST_1_ID}}'],
  relationshipMonoHasOne: '{{POST_1_ID}}',
  relationshipPolyHasMany: [{ relationTo: 'posts', value: '{{POST_1_ID}}' }],
  relationshipPolyHasOne: { relationTo: 'posts', value: '{{POST_1_ID}}' },
  arrayOfRelationships: [
    {
      uploadInArray: '{{MEDIA_ID}}',
      richTextInArray: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              format: '',
              type: 'relationship',
              version: 1,
              relationTo: postsSlug,
              value: {
                id: '{{POST_1_ID}}',
              },
            },
            {
              children: [],
              direction: null,
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            },
            {
              format: '',
              type: 'upload',
              version: 1,
              fields: null,
              relationTo: 'media',
              value: {
                id: '{{MEDIA_ID}}',
              },
            },
          ],
          direction: null,
        },
      },
      relationshipInArrayMonoHasMany: ['{{POST_1_ID}}'],
      relationshipInArrayMonoHasOne: '{{POST_1_ID}}',
      relationshipInArrayPolyHasMany: [{ relationTo: 'posts', value: '{{POST_1_ID}}' }],
      relationshipInArrayPolyHasOne: { relationTo: 'posts', value: '{{POST_1_ID}}' },
    },
  ],
  tab: {
    relationshipInTab: '{{POST_1_ID}}',
  },
}
