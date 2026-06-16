# Rich Text (Lexical)

Use when working with Payload's Lexical-based rich text editor — configuring features, converting content to HTML/JSX/Markdown/plaintext, building custom blocks or features, rendering on demand, or customizing admin behavior.

## Quick Reference

| Task                     | Solution                                                           | Section                                                         |
| ------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Install the editor       | `pnpm install @payloadcms/richtext-lexical`                        | [Setup](#setup)                                                 |
| Set root-level editor    | `editor: lexicalEditor({})` in `buildConfig`                       | [Setup](#setup)                                                 |
| Override per-field       | `editor: lexicalEditor({})` on the field                           | [Setup](#setup)                                                 |
| Add/remove features      | `features: ({ defaultFeatures }) => [...]`                         | [Official Features](#official-features)                         |
| Add blocks in editor     | `BlocksFeature({ blocks: [...] })`                                 | [Custom Blocks](#custom-blocks--inline-blocks)                  |
| Convert to HTML          | `convertLexicalToHTML({ data })`                                   | [Converting to HTML](#converting-to-html)                       |
| Convert to JSX           | `<RichText data={data} />`                                         | [Converting to JSX](#converting-to-jsx)                         |
| Convert to/from Markdown | `convertLexicalToMarkdown` / `convertMarkdownToLexical`            | [Converting to/from Markdown](#converting-tofrom-markdown--mdx) |
| Convert to plaintext     | `convertLexicalToPlaintext({ data })`                              | [Converting to Plaintext](#converting-to-plaintext)             |
| Get editor config        | `editorConfigFactory.default({ config })`                          | [Retrieving Editor Config](#retrieving-editor-config)           |
| Render on demand         | `<RenderLexical field=... schemaPath=... />`                       | [Rendering on Demand](#rendering-on-demand)                     |
| Detect empty editor      | `hasText(richtextData)` from `@payloadcms/richtext-lexical/shared` | [Admin Customization](#admin-customization)                     |

## Setup

Install the package and register the editor at root level or per-field:

```ts
// see test/lexical/config.ts
import { buildConfig } from 'payload'
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export default buildConfig({
  // Root-level editor — applied to every richText field that doesn't override it
  editor: lexicalEditor({}),
  collections: [
    {
      slug: 'pages',
      fields: [
        {
          name: 'content',
          type: 'richText',
          // Field-level override — only this field gets FixedToolbarFeature
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
          }),
        },
      ],
    },
  ],
})
```

The `features` prop accepts an array or a function. The function receives:

| Prop              | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `defaultFeatures` | The opinionated default feature set                            |
| `rootFeatures`    | Features on the root editor (empty if this IS the root editor) |

## Official Features

All features are exported from `@payloadcms/richtext-lexical`.

| Feature                     | Default | Description                                          |
| --------------------------- | ------- | ---------------------------------------------------- |
| `BoldFeature`               | Yes     | Bold text. Shortcut: Cmd+B. Markdown: `**bold**`     |
| `ItalicFeature`             | Yes     | Italic text. Shortcut: Cmd+I. Markdown: `*italic*`   |
| `UnderlineFeature`          | Yes     | Underline. Shortcut: Cmd+U                           |
| `StrikethroughFeature`      | Yes     | Strikethrough. Markdown: `~~text~~`                  |
| `SubscriptFeature`          | Yes     | Subscript text                                       |
| `SuperscriptFeature`        | Yes     | Superscript text                                     |
| `InlineCodeFeature`         | Yes     | Inline code spans                                    |
| `ParagraphFeature`          | Yes     | Slash-menu + toolbar entry for paragraph blocks      |
| `HeadingFeature`            | Yes     | H1–H6 headings (customizable)                        |
| `AlignFeature`              | Yes     | Left / center / right / justify alignment            |
| `IndentFeature`             | Yes     | Indent/outdent controls                              |
| `UnorderedListFeature`      | Yes     | Unordered lists (`<ul>`)                             |
| `OrderedListFeature`        | Yes     | Ordered lists (`<ol>`)                               |
| `ChecklistFeature`          | Yes     | Interactive checklists                               |
| `LinkFeature`               | Yes     | Internal and external links                          |
| `RelationshipFeature`       | Yes     | Block-level relationship nodes                       |
| `BlockquoteFeature`         | Yes     | Block-level quotes                                   |
| `UploadFeature`             | Yes     | Block-level upload nodes (images, files, etc.)       |
| `HorizontalRuleFeature`     | Yes     | `<hr>` separators                                    |
| `InlineToolbarFeature`      | Yes     | Floating toolbar on text selection                   |
| `FixedToolbarFeature`       | **No**  | Persistent top toolbar                               |
| `BlocksFeature`             | **No**  | Embed Payload Blocks inside the editor               |
| `EXPERIMENTAL_TableFeature` | **No**  | Table support (may change without major version)     |
| `TextStateFeature`          | **No**  | Key-value attributes on TextNodes with inline styles |
| `TreeViewFeature`           | **No**  | Debug box showing live editor state (dev only)       |

### Customizing built-in features

```ts
// see test/lexical/config.ts
import {
  HeadingFeature,
  LinkFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    // Restrict headings to h2 and h3 only
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    // Add a custom link field
    LinkFeature({
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'rel',
          type: 'select',
          hasMany: true,
          options: ['noopener', 'noreferrer', 'nofollow'],
        },
      ],
    }),
    // Add a custom field to upload nodes
    UploadFeature({
      collections: {
        media: {
          fields: [{ name: 'caption', type: 'richText', editor: lexicalEditor() }],
        },
      },
    }),
  ],
})
```

## Custom Blocks & Inline Blocks

Payload blocks can be embedded directly in the editor via `BlocksFeature`. Blocks support all field types, hooks, validation, and conditional logic — data lives in the rich text JSON rather than separate collection fields.

### Blocks vs Inline Blocks

- **Blocks** (`blocks: [...]`) are block-level — take up a full line like a paragraph or heading.
- **Inline Blocks** (`inlineBlocks: [...]`) can flow within text in the same paragraph.

```ts
// see test/lexical/config.ts
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [
        {
          slug: 'callout',
          fields: [
            {
              name: 'style',
              type: 'select',
              options: ['info', 'warning', 'error'],
              defaultValue: 'info',
            },
            { name: 'content', type: 'textarea', required: true },
          ],
        },
      ],
      inlineBlocks: [
        {
          slug: 'mention',
          fields: [{ name: 'user', type: 'relationship', relationTo: 'users', required: true }],
        },
      ],
    }),
  ],
})
```

### Custom Block Components

Override how a block renders inside the editor using `admin.components.Block` (block-level) or `admin.components.Label` (block label):

```ts
{
  slug: 'callout',
  admin: {
    components: {
      Block: '/src/components/CalloutBlock#CalloutBlock',
      Label: '/src/components/CalloutLabel#CalloutLabel',
    },
  },
  fields: [{ name: 'style', type: 'select', options: ['info', 'warning'] }],
}
```

Import composable primitives from `@payloadcms/richtext-lexical/client` inside the custom component — they receive block data from context automatically.

### TypeScript for block nodes

```ts
// see test/lexical/payload-types.ts
import type {
  SerializedBlockNode,
  SerializedInlineBlockNode,
  DefaultNodeTypes,
  TypedEditorState,
} from '@payloadcms/richtext-lexical'

// Union over all node types your field uses
type MyEditorNodes =
  | DefaultNodeTypes
  | SerializedBlockNode<CalloutBlock>
  | SerializedInlineBlockNode<MentionBlock>

type MyEditorState = TypedEditorState<MyEditorNodes>

// Or use DefaultTypedEditorState if only default features are present
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
```

Use `SerializedBlockNode<T>` for block fields and `SerializedInlineBlockNode<T>` for inline block fields. Import types from `@payloadcms/richtext-lexical` only — not from core Lexical packages.

## Retrieving Editor Config

Many converters require the editor config. Use `editorConfigFactory` from `@payloadcms/richtext-lexical`:

### Strategy 1 — Default editor config

```ts
import { editorConfigFactory } from '@payloadcms/richtext-lexical'
import config from '@payload-config'

const editorConfig = await editorConfigFactory.default({ config })
```

### Strategy 2 — Extract from a field

```ts
const editorConfig = editorConfigFactory.fromField({
  field: config.collections[0].fields[1], // must be a RichTextField
})
```

This is synchronous and does not require `await`. Use it inside hooks where you have `siblingFields` available.

### Strategy 3 — Create from features

```ts
import { editorConfigFactory, FixedToolbarFeature } from '@payloadcms/richtext-lexical'

const editorConfig = await editorConfigFactory.fromFeatures({
  config,
  features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
})
```

### Strategy 4 — Extract from an instantiated editor

```ts
const editor = lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures] })

const editorConfig = await editorConfigFactory.fromEditor({ config, editor })
```

Prefer strategies 1–3 over this one — instantiating the editor just to retrieve its config is less efficient.

## Converting to HTML

### On-demand (recommended)

```ts
// see test/lexical/lexical.int.spec.ts
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

// Synchronous — data must already be fully populated
const html = convertLexicalToHTML({ data })
```

### Dynamic population (async)

Use when data contains unpopulated relationship/upload nodes:

```ts
import { getRestPopulateFn } from '@payloadcms/richtext-lexical/client'
import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async'

// Client-side: use REST populate fn
const html = await convertLexicalToHTMLAsync({
  data,
  populate: getRestPopulateFn({ apiURL: 'http://localhost:3000/api' }),
})

// Server-side RSC: use Payload populate fn (more efficient — no extra network hop)
import { getPayloadPopulateFn } from '@payloadcms/richtext-lexical'
const html = await convertLexicalToHTMLAsync({
  data,
  populate: await getPayloadPopulateFn({ currentDepth: 0, depth: 1, payload }),
})
```

### HTML field helper (`lexicalHTMLField`)

Stores HTML alongside the richText field, refreshed by an `afterRead` hook. Not recommended — creates a duplicate column. Use on-demand conversion instead unless a static HTML column is explicitly required.

```ts
import { lexicalHTMLField } from '@payloadcms/richtext-lexical'

// In a collection's fields array:
lexicalHTMLField({
  htmlFieldName: 'content_html',
  lexicalFieldName: 'content',
})
```

### Blocks-to-HTML

When the editor contains custom blocks, pass a `converters` function to map block slugs to HTML strings:

```ts
import { type HTMLConvertersFunction } from '@payloadcms/richtext-lexical/html'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { CalloutBlock } from '@/payload-types'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CalloutBlock>

const htmlConverters: HTMLConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    callout: ({ node, providedCSSString }) =>
      `<div class="callout callout--${node.fields.style}${providedCSSString}">${node.fields.content}</div>`,
  },
})

const html = convertLexicalToHTML({ converters: htmlConverters, data })
```

### HTML to rich text

```ts
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom' // install jsdom + @types/jsdom separately

const lexicalJSON = convertHTMLToLexical({
  editorConfig: await editorConfigFactory.default({ config }),
  html: '<p>Hello world</p>',
  JSDOM,
})
```

**Image handling:** `<img>` tags are NOT automatically converted to Upload nodes. Either pre-upload images and use `data-upload-id` attributes, or omit images and handle them separately. See [docs/rich-text/converting-html.mdx](../docs/rich-text/converting-html.mdx#converting-html-with-images) for approach details.

## Converting to JSX

```tsx
// see test/lexical/lexical.int.spec.ts
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export const MyComponent = ({ data }: { data: SerializedEditorState }) => <RichText data={data} />
```

`RichText` includes built-in converters for default nodes. Pass `converters` prop for custom blocks or node overrides.

### Internal links

By default Payload doesn't know how to convert internal links to URLs. Pass `internalDocToHref` to `LinkJSXConverter`:

```tsx
import type { DefaultNodeTypes, SerializedLinkNode } from '@payloadcms/richtext-lexical'
import { type JSXConvertersFunction, LinkJSXConverter, RichText } from '@payloadcms/richtext-lexical/react'

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { relationTo, value } = linkNode.fields.doc!
  if (typeof value !== 'object') throw new Error('Expected populated doc')

  switch (relationTo) {
    case 'posts': return `/posts/${value.slug}`
    case 'pages': return `/${value.slug}`
    default: return `/${relationTo}/${value.slug}`
  }
}

const jsxConverters: JSXConvertersFunction<DefaultNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
})

// Pass converters to RichText
<RichText data={data} converters={jsxConverters} />
```

### Block JSX converters

```tsx
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CalloutBlock>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    callout: ({ node }) => (
      <div className={`callout callout--${node.fields.style}`}>{node.fields.content}</div>
    ),
  },
})
```

## Converting to/from Markdown / MDX

### Lexical to Markdown

```ts
import { convertLexicalToMarkdown, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

const markdown = convertLexicalToMarkdown({
  data,
  editorConfig: await editorConfigFactory.default({ config }),
})
```

Use `editorConfigFactory.fromField` inside collection hooks when `siblingFields` is available — avoids re-building the config on every request.

### Markdown to Lexical

```ts
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

const lexicalJSON = convertMarkdownToLexical({
  editorConfig: await editorConfigFactory.default({ config }),
  markdown: '# Hello world\n\nThis is **bold**.',
})
```

**Upload placeholder format:** Standard `![alt](url)` is NOT converted. Use `![media:<id>]()` instead, where `media` is your upload collection slug.

### MDX (custom block import/export)

MDX converters are stored on blocks passed to `BlocksFeature`, not on features. Define `mdxExportConverter` and `mdxImportConverter` on each block:

```ts
// see test/lexical-mdx/ for a full working example
import type { Block } from 'payload'

const BannerBlock: Block = {
  slug: 'Banner',
  fields: [
    { name: 'type', type: 'select', options: ['info', 'warning', 'error'], defaultValue: 'info' },
    { name: 'content', type: 'richText', editor: lexicalEditor() },
  ],
  // Defines how this block serializes to MDX string:
  mdxExportConverter: ({ node }) =>
    `<Banner type="${node.fields.type}">\n${convertLexicalToMarkdown({ data: node.fields.content, editorConfig })}\n</Banner>`,
  // Defines how to parse the MDX string back to this block's fields:
  mdxImportConverter: async ({ mdxJsxFlowElement, toEditorConfig }) => ({
    type: mdxJsxFlowElement.attributes.find((a) => a.name === 'type')?.value ?? 'info',
    content: await convertMarkdownToLexical({
      markdown: mdxJsxFlowElement.children,
      editorConfig: toEditorConfig,
    }),
  }),
}
```

## Converting to Plaintext

```ts
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

const plaintext = convertLexicalToPlaintext({ data })
```

### Custom converters

```ts
import {
  convertLexicalToPlaintext,
  type PlaintextConverters,
} from '@payloadcms/richtext-lexical/plaintext'
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'

const converters: PlaintextConverters<DefaultNodeTypes | SerializedBlockNode<CalloutBlock>> = {
  blocks: {
    callout: ({ node }) => node.fields.content ?? '',
  },
  link: ({ node }) => node.fields.url ?? '',
}

const plaintext = convertLexicalToPlaintext({ converters, data })
```

There are no default plaintext converters. Nodes without a converter fall back to: use `text` field → recurse `children` → ignore.

## Building Custom Features

Consider using `BlocksFeature` first. A custom feature is warranted when you need custom Lexical nodes with specialized rendering or commands that `BlocksFeature` cannot provide.

### Server feature

```ts
// myFeature/feature.server.ts
import { createServerFeature, createNode } from '@payloadcms/richtext-lexical'
import type { ElementTransformer } from '@payloadcms/richtext-lexical/lexical/markdown'

export const MyFeature = createServerFeature({
  feature: {
    // i18n translations scoped to the feature key
    i18n: {
      en: { label: 'My Feature' },
      de: { label: 'Mein Feature' },
    },
    // Markdown transformers — must match between server and client features
    markdownTransformers: [MyMarkdownTransformer],
    // Nodes — control HTML conversion, hooks, sub-fields, headless behavior
    nodes: [
      createNode({
        node: MyNode,
        converters: {
          html: {
            converter: ({ node }) => `<hr/>`,
            nodeTypes: [MyNode.getType()],
          },
        },
      }),
    ],
    // Register client feature (import path syntax)
    ClientFeature: './feature.client#MyClientFeature',
  },
  key: 'myFeature',
  // Load after these features (they must exist)
  dependenciesPriority: ['otherFeature'],
})
```

`createNode` sub-field options:

| Option             | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `node`             | The Lexical node class                                   |
| `converters`       | HTML serialization (markdown via `markdownTransformers`) |
| `getSubFields`     | Fields schema for nested field population + hooks        |
| `getSubFieldsData` | Returns data matching `getSubFields` schema              |
| `hooks`            | Node-level hooks (like field hooks, but for nodes)       |
| `validations`      | Node validation run during document validate             |

### Client feature

```ts
// myFeature/feature.client.ts — MUST have 'use client' directive
'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

export const MyClientFeature = createClientFeature({
  // Client nodes (same nodes array, registers them for editor rendering)
  nodes: [MyNode],
  // Lexical plugins (EditorPlugin components)
  plugins: [{ Component: './MyPlugin#MyPlugin' }],
  // Add items to toolbar groups or create new groups
  toolbarFixed: {
    groups: [
      {
        type: 'buttons',
        key: 'myGroup',
        items: [{ key: 'myButton', Component: './MyButton#MyButton' }],
      },
    ],
  },
  toolbarInline: {
    groups: [
      {
        type: 'buttons',
        key: 'myGroup',
        items: [{ key: 'myButton', Component: './MyButton#MyButton' }],
      },
    ],
  },
  // Slash menu entries
  slashMenu: {
    groups: [
      {
        key: 'myGroup',
        label: 'My Nodes',
        items: [
          {
            key: 'myItem',
            Label: './MyItem#MyItem',
            Icon: './MyIcon#MyIcon',
            keywords: ['custom'],
          },
        ],
      },
    ],
  },
})
```

Use `@payloadcms/richtext-lexical/client` for all client imports — never `@payloadcms/richtext-lexical` in a `'use client'` file. Type imports are excluded from this rule.

### Passing props from server to client

The server feature's `ClientFeature` path supports `clientProps` that are serialized and forwarded to the client feature:

```ts
// feature.server.ts
export const MyFeature = createServerFeature({
  feature: ({ props }) => ({
    ClientFeature: {
      path: './feature.client#MyClientFeature',
      clientProps: {
        // Serialize any server-side config for the client
        options: props?.options ?? {},
      },
    },
  }),
  key: 'myFeature',
})
```

Do not import directly from core Lexical packages (`lexical`, `@lexical/utils`, etc.). Use the re-exported versions from `@payloadcms/richtext-lexical/lexical/utils` and similar sub-paths.

## Custom Views & Node Overrides

Views define how nodes render in the admin panel and can share the same rendering logic with JSX converters. They are experimental.

### Defining views

Create a `'use client'` file exporting a `LexicalEditorViewMap`:

```tsx
// collections/Posts/views.tsx
// see docs/rich-text/views.mdx for full example
'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

export const postViews: LexicalEditorViewMap = {
  default: {
    nodes: {
      heading: {
        // Override createDOM for node rendering in the admin panel
        createDOM(args) {
          const { node } = args
          const el = document.createElement(node.getTag())
          el.style.color = '#333'
          return el
        },
      },
    },
  },
  preview: {
    admin: { hideGutter: true },
    // Override theme classes
    lexical: { theme: { heading: { h1: 'preview-h1' } } },
  },
}
```

### Registering views on the field

```ts
{
  name: 'content',
  type: 'richText',
  editor: lexicalEditor({
    // Import path with #exportName
    views: './collections/Posts/views.js#postViews',
  }),
}
```

### Views vs JSX converters

Use views when you want to share rendering logic between the admin panel and your frontend. Pass the view's `nodeMap` to `convertLexicalToJSX` or `<RichText>` for consistent output. When both `converters` and a view's `nodeMap` are passed, the node map wins per-node-type.

### Inline block / block Label components

Label components customize what the block displays in the editor without replacing the full block editing UI. Pass `admin.components.Label` on the block config (see [Custom Blocks](#custom-blocks--inline-blocks)).

## Rendering on Demand

`<RenderLexical>` (experimental) renders a Lexical editor from an RSC-style server action, covering the full feature set including nested block schemas.

### Inside an existing Form

```tsx
'use client'
import { buildEditorState, RenderLexical } from '@payloadcms/richtext-lexical/client'
;<RenderLexical
  field={{ name: 'richText' /* must match the field name in the form */ }}
  initialValue={buildEditorState<DefaultNodeTypes>({ text: 'default value' })}
  schemaPath={`collection.posts.richText`}
/>
```

### Outside a Form (you control state)

```tsx
'use client'
import { buildEditorState, RenderLexical } from '@payloadcms/richtext-lexical/client'
import React, { useState } from 'react'

const [value, setValue] = useState(() => buildEditorState<DefaultNodeTypes>({ text: 'initial' }))

<RenderLexical
  field={{ name: 'myField' }}
  initialValue={buildEditorState<DefaultNodeTypes>({ text: 'initial' })}
  schemaPath={`collection.posts.richText`}
  setValue={setValue as any}
  value={value}
/>
```

### Choosing `schemaPath`

Format: `collection.<slug>.<fieldPath>` or `global.<slug>.<fieldPath>`

Examples:

- Top-level field: `collection.posts.richText`
- Nested in group: `collection.posts.content.richText`

If the target field is deeply nested in arrays/blocks, define a hidden top-level richText field as a "render anchor" and use its path instead.

## Admin Customization

Configure the `admin` prop inside `lexicalEditor({})`:

| Property                    | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `placeholder`               | Placeholder text shown when editor is empty    |
| `hideGutter`                | Hide the left-side gutter (default: false)     |
| `hideInsertParagraphAtEnd`  | Hide the "+" button at the editor's end        |
| `hideDraggableBlockElement` | Hide the drag handle on hover                  |
| `hideAddBlockButton`        | Hide the "+" that appears when hovering a node |

```ts
{
  name: 'content',
  type: 'richText',
  editor: lexicalEditor({
    admin: {
      hideGutter: true,
      placeholder: 'Start writing...',
      hideInsertParagraphAtEnd: true,
    },
  }),
}
```

### Detecting empty state

When a user types and deletes all content, the field value becomes a JSON object with an empty paragraph — not `null`. Use `hasText` to check:

```ts
import { hasText } from '@payloadcms/richtext-lexical/shared'

if (!hasText(doc.content)) {
  // editor is empty
}
```

## Gotchas

1. **Converter requires the editor config.** `convertLexicalToMarkdown` and `convertHTMLToLexical` require the editor config via `editorConfigFactory`. Passing a raw `lexicalEditor()` call does not work — you must resolve it with `editorConfigFactory`.

2. **Markdown transformers must be registered on both server and client features.** If you add a markdown transformer only to the server feature, it will convert to markdown correctly but fail to parse back. Register matching transformers in both `feature.server.ts` and `feature.client.ts`.

3. **Lexical state vs HTML render mismatch.** `convertLexicalToHTML` renders the stored JSON state at the time of conversion. If an upload node is stored with only the document ID (unpopulated), the HTML will not have the image URL. Always use `convertLexicalToHTMLAsync` with a `populate` function when your editor contains relationship or upload nodes.

4. **Do not import from core Lexical packages.** Importing `lexical`, `@lexical/utils`, etc. directly can break across minor Payload version bumps. Use the re-exports under `@payloadcms/richtext-lexical/lexical/*`.

5. **`'use client'` boundary.** Client features and client components must not import from `@payloadcms/richtext-lexical` (server entry). Use `@payloadcms/richtext-lexical/client` instead. Type imports are always safe.

6. **`EXPERIMENTAL_TableFeature` is not stable.** It may change or be removed in a minor Payload release. Pin the Lexical package version if you rely on it.

7. **Empty editor JSON is not `null`.** After a user types and deletes content, the field stores a JSON structure with an empty paragraph rather than `null`. Use `hasText` from `@payloadcms/richtext-lexical/shared` to detect the empty state.

## Related

- [FIELDS.md](FIELDS.md) — `richText` field type, `admin.components.Field` override
- [CUSTOM-COMPONENTS.md](CUSTOM-COMPONENTS.md) — updating Lexical via `useField` + `dispatchFields` from a client component
