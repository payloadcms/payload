import type {
  LexicalRichTextAdapter,
  SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'
import type { CollectionConfig, RichTextField } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  getEnabledNodes,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'path'

export const postsSlug = 'posts'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      admin: {
        components: {
          Label: '/collections/Posts/MyComponent.js#MyComponent',
        },
        description: 'This is a description',
      },
      name: 'text',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          EXPERIMENTAL_TableFeature(),
          BlocksFeature({
            blocks: [
              {
                slug: 'Banner',
                jsx: {
                  import: ({ props, children, markdownToLexical }) => {
                    return {
                      type: props?.type,
                      content: markdownToLexical({ markdown: children }),
                    }
                  },
                  export: ({ fields, lexicalToMarkdown }) => {
                    return {
                      props: {
                        type: fields.type,
                      },
                      children: lexicalToMarkdown({ editorState: fields.content }),
                    }
                  },
                },
                fields: [
                  {
                    name: 'type',
                    type: 'text',
                  },
                  {
                    name: 'content',
                    type: 'richText',
                    editor: lexicalEditor(),
                  },
                ],
              },
            ],
          }),
        ],
      }),
      hooks: {
        beforeChange: [
          ({ value, field, req }) => {
            const editorConfig: SanitizedServerEditorConfig = (
              (field as RichTextField).editor as LexicalRichTextAdapter
            ).editorConfig

            const headlessEditor = createHeadlessEditor({
              nodes: getEnabledNodes({
                editorConfig,
              }),
            })

            // Convert lexical state to markdown
            // Import editor state into your headless editor
            try {
              headlessEditor.setEditorState(headlessEditor.parseEditorState(value)) // This should commit the editor state immediately
            } catch (e) {
              req.payload.logger.error({ err: e }, 'ERROR parsing editor state')
            }

            // Export to markdown
            let markdown: string
            headlessEditor.getEditorState().read(() => {
              markdown = $convertToMarkdownString(editorConfig?.features?.markdownTransformers)
            })

            // Write markdown to '../../../../docs/admin/overview.mdx'
            fs.writeFileSync(
              path.resolve(dirname, '../../../../docs/admin/overview.mdx'),
              markdown,
              { encoding: 'utf-8' },
            )

            return value
          },
        ],
        afterRead: [
          ({ field }) => {
            const mdx = fs.readFileSync(
              path.resolve(dirname, '../../../../docs/admin/overview.mdx'),
              { encoding: 'utf-8' },
            )

            const editorConfig: SanitizedServerEditorConfig = (
              (field as RichTextField).editor as LexicalRichTextAdapter
            ).editorConfig

            const headlessEditor = createHeadlessEditor({
              nodes: getEnabledNodes({
                editorConfig,
              }),
            })

            headlessEditor.update(
              () => {
                $convertFromMarkdownString(mdx, editorConfig.features.markdownTransformers)
              },
              { discrete: true },
            )

            return headlessEditor.getEditorState().toJSON()
          },
        ],
      },
    },
  ],
  versions: {
    drafts: true,
  },
}
