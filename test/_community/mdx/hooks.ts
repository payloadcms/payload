import type { CollectionAfterReadHook, CollectionBeforeChangeHook, RichTextField } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import { docsBasePath } from '@payload-config'
import {
  type LexicalRichTextAdapter,
  type SanitizedServerEditorConfig,
  extractFrontmatter,
  frontmatterToObject,
  getEnabledNodes,
  objectToFrontmatter,
} from '@payloadcms/richtext-lexical'
import fs from 'node:fs'
import path from 'path'
import { deepCopyObjectSimple } from 'payload'

export const saveMDXBeforeChange: CollectionBeforeChangeHook = ({
  collection,
  data,
  context,
  req,
}) => {
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
    fs.writeFileSync(docFilePath, markdown, {
      encoding: 'utf-8',
    })
  }

  return null // Do not save anything to database
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
}
