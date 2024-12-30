import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { CollectionAfterReadHook, CollectionBeforeChangeHook, RichTextField } from 'payload'

import {
  $convertFromMarkdownString,
  extractFrontmatter,
  frontmatterToObject,
  getEnabledNodes,
  type LexicalRichTextAdapter,
  objectToFrontmatter,
  type SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless'
import { $convertToMarkdownString } from '@payloadcms/richtext-lexical/lexical/markdown'
import fs from 'node:fs'
import path from 'path'
import { deepCopyObjectSimple } from 'payload'

import { docsBasePath } from '../collections/Posts/shared.js'

export const editorJSONToMDX = ({
  editorState,
  editorConfig,
  frontMatterData,
}: {
  editorConfig: SanitizedServerEditorConfig
  editorState: any
  frontMatterData?: any
}) => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig,
    }),
  })

  // Convert lexical state to markdown
  // Import editor state into your headless editor
  try {
    headlessEditor.setEditorState(headlessEditor.parseEditorState(editorState)) // This should commit the editor state immediately
  } catch (e) {
    console.error('Error parsing editor state', e)
  }

  // Export to markdown
  let markdown: string
  headlessEditor.getEditorState().read(() => {
    markdown = $convertToMarkdownString(editorConfig?.features?.markdownTransformers)
  })

  if (!frontMatterData) {
    return markdown
  }

  const frontMatterOriginalData = deepCopyObjectSimple(frontMatterData)

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

  return markdown
}

export const saveMDXBeforeChange: CollectionBeforeChangeHook = ({ collection, data, context }) => {
  if (context.seed) {
    return data
  }
  const docFilePath = path.join(docsBasePath, data.docPath)

  const field: RichTextField = collection.fields.find(
    (field) => 'name' in field && field.name === 'richText',
  ) as RichTextField
  const value = data[field.name]

  const editorConfig: SanitizedServerEditorConfig = (field.editor as LexicalRichTextAdapter)
    .editorConfig

  const markdown = editorJSONToMDX({
    editorState: value,
    editorConfig,
    frontMatterData: data.frontMatter,
  })

  if (markdown?.trim()?.length) {
    // Write markdown to '../../../../docs/admin/overview.mdx'
    fs.writeFileSync(docFilePath, markdown, {
      encoding: 'utf-8',
    })
  }

  return null // Do not save anything to database
}

export function mdxToEditorJSON({
  mdxWithFrontmatter,
  editorConfig,
}: {
  editorConfig: SanitizedServerEditorConfig
  mdxWithFrontmatter: string
}): {
  editorState: SerializedEditorState
  frontMatter: { key: string; value: string }[]
} {
  const frontMatter = extractFrontmatter(mdxWithFrontmatter)

  const mdx = frontMatter.content

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
    editorState: headlessEditor.getEditorState().toJSON(),
    frontMatter: frontMatterArray,
  }
}

export const loadMDXAfterRead: CollectionAfterReadHook = ({ collection, doc, context }) => {
  if (context.seed) {
    return doc
  }
  const field: RichTextField = collection.fields.find(
    (field) => 'name' in field && field.name === 'richText',
  ) as RichTextField

  const docFilePath = path.join(docsBasePath, doc.docPath)

  const mdxWithFrontmatter = fs.readFileSync(docFilePath, {
    encoding: 'utf-8',
  })
  const editorConfig: SanitizedServerEditorConfig = (field.editor as LexicalRichTextAdapter)
    .editorConfig

  const result = mdxToEditorJSON({
    mdxWithFrontmatter,
    editorConfig,
  })

  return {
    ...doc,
    richText: result.editorState,
    frontMatter: result.frontMatter,
  }
}
