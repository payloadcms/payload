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
  extractFrontmatter,
  frontmatterToObject,
  getEnabledNodes,
  lexicalEditor,
  objectToFrontmatter,
} from '@payloadcms/richtext-lexical'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { deepCopyObjectSimple } from 'payload'

export const postsSlug = 'posts'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const CODE_BLOCK_REG_EXP = /^[ \t]*```(\w{1,10})?\s?$/

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  hooks: {
    beforeChange: [
      ({ collection, data, req }) => {
        const field: RichTextField = collection.fields.find(
          (field) => 'name' in field && field.name === 'richText',
        ) as RichTextField
        const value = data[field.name]

        const editorConfig: SanitizedServerEditorConfig = (field.editor as LexicalRichTextAdapter)
          .editorConfig

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

        const frontMatterOriginalData = deepCopyObjectSimple(data.frontMatter)

        //Frontmatter
        const frontmatterData = {}

        if (frontMatterOriginalData) {
          for (const frontMatterArrayEntry of frontMatterOriginalData) {
            frontmatterData[frontMatterArrayEntry.key] = frontMatterArrayEntry.value
          }

          const frontmatterString = objectToFrontmatter(frontmatterData)

          if (frontmatterString?.length) {
            markdown = frontmatterString + '\n' + markdown
          }
        }

        if (markdown?.trim()?.length) {
          // Write markdown to '../../../../docs/admin/overview.mdx'
          fs.writeFileSync(path.resolve(dirname, '../../../../docs/admin/overview.mdx'), markdown, {
            encoding: 'utf-8',
          })
        }

        return null // Do not save anything to database
      },
    ],
    afterRead: [
      ({ collection, doc }) => {
        const field: RichTextField = collection.fields.find(
          (field) => 'name' in field && field.name === 'richText',
        ) as RichTextField
        const mdxWithFrontmatter = fs.readFileSync(
          path.resolve(dirname, '../../../../docs/admin/overview.mdx'),
          {
            encoding: 'utf-8',
          },
        )

        const frontMatter = extractFrontmatter(mdxWithFrontmatter)

        const mdx = frontMatter.content

        const editorConfig: SanitizedServerEditorConfig = (field.editor as LexicalRichTextAdapter)
          .editorConfig

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

        const frontMatterArray = frontMatter?.frontmatter?.length
          ? Object.entries(frontmatterToObject(frontMatter.frontmatter)).map(([key, value]) => ({
              key,
              value,
            }))
          : []

        return {
          ...doc,
          richText: headlessEditor.getEditorState().toJSON(),
          frontMatter: frontMatterArray,
        }
      },
    ],
  },
  fields: [
    {
      type: 'collapsible',
      label: 'FrontMatter',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'frontMatter',
          type: 'array',
          fields: [
            {
              type: 'text',
              name: 'key',
            },
            {
              type: 'text',
              name: 'value',
            },
          ],
        },
      ],
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
              {
                slug: 'Code',
                jsx: {
                  customStartRegex: CODE_BLOCK_REG_EXP,
                  customEndRegex: CODE_BLOCK_REG_EXP,
                  import: ({ openMatch, children }) => {
                    const language = openMatch[1]
                    return {
                      language,
                      code: children,
                    }
                  },
                  export: ({ fields }) => {
                    return '```' + fields.language + '\n' + fields.code + '\n```'
                  },
                },
                fields: [
                  {
                    name: 'language',
                    type: 'text',
                  },
                  {
                    name: 'code',
                    type: 'code',
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
  ],
  versions: {
    drafts: true,
  },
}
