import type { CodegenEvalCase } from '../../types.js'

/**
 * Rich text (Lexical) eval cases.
 *
 * NOTE for downstream task implementers:
 * Only include assertions that the LLM must actively produce — never assertions
 * already satisfied by the starter fixture (those are false signal). When no
 * AST assertion kind applies, leave `assertions: []` and rely on the scorer.
 *
 * AST hygiene for rich text:
 * - Feature configuration lives inside `lexicalEditor({ features: [...] })` which
 *   is a function argument, not a static object path. No assertion kind can verify
 *   array element contents. Those cases use `assertions: []` + scorer only.
 * - `configOption { path: 'editor' }` verifies that the root editor is set in
 *   buildConfig — confirms the LLM placed it at the right level.
 * - `fieldOption { option: 'editor' }` verifies a field-level editor override exists.
 * - `fieldExists` + `fieldOption { option: 'type', value: 'richText' }` verifies a
 *   missing richText field was added with the correct type.
 */
export const richtextCodegenDataset: CodegenEvalCase[] = [
  // ──────────────────────────────────────────────────────────
  // Positive cases — valid config modifications
  // ──────────────────────────────────────────────────────────
  {
    input:
      'Configure lexicalEditor as the root-level editor in the Payload config so all richText fields use Lexical by default.',
    expected:
      'editor property added to buildConfig set to lexicalEditor({}) (or lexicalEditor with features), imported from @payloadcms/richtext-lexical',
    category: 'richtext',
    fixturePath: 'richtext/codegen/switch-root-editor-to-lexical',
    // configOption verifies the root editor property exists in buildConfig
    assertions: [{ kind: 'configOption', path: 'editor' }],
  },
  {
    input: 'Add a fixed toolbar to the body richText field on the posts collection.',
    expected:
      'FixedToolbarFeature() added to the features array of the lexicalEditor on the body field; imported from @payloadcms/richtext-lexical',
    category: 'richtext',
    fixturePath: 'richtext/codegen/add-fixed-toolbar',
    // FixedToolbarFeature is an element in the features array — no AST kind for array element contents
    assertions: [],
  },
  {
    input:
      'Add table support to the content richText field on the posts collection using the experimental table feature.',
    expected:
      'EXPERIMENTAL_TableFeature() added to the features array of the lexicalEditor on the content field; imported from @payloadcms/richtext-lexical',
    category: 'richtext',
    fixturePath: 'richtext/codegen/add-tables-feature',
    // Feature array content not introspectable by AST catalog; fieldOption verifies editor override exists on the field
    assertions: [{ kind: 'fieldOption', slug: 'posts', field: 'content', option: 'editor' }],
  },
  {
    input:
      'Add a BlocksFeature with a callout block to the body richText field on the posts collection. The callout block should have a style field (select: info, warning, error) and a content field (textarea).',
    expected:
      'BlocksFeature with a callout block added to the features array of the lexicalEditor on the body field; callout block has a style select field and a content textarea field',
    category: 'richtext',
    fixturePath: 'richtext/codegen/add-blocks-feature-with-blocks',
    // BlocksFeature content not introspectable; fieldOption verifies editor override exists on the field
    assertions: [{ kind: 'fieldOption', slug: 'posts', field: 'body', option: 'editor' }],
  },
  {
    input:
      'Configure the body richText field on the posts collection to only enable Bold and Italic features, removing all other default features.',
    expected:
      'lexicalEditor on the body field configured with features: [BoldFeature(), ItalicFeature()] — no ...defaultFeatures spread — removing all other features',
    category: 'richtext',
    fixturePath: 'richtext/codegen/disable-default-features',
    // Feature array contents not introspectable; fieldOption verifies editor override exists
    assertions: [{ kind: 'fieldOption', slug: 'posts', field: 'body', option: 'editor' }],
  },
  {
    input: 'Limit headings to h2 and h3 only on the body richText field of the posts collection.',
    expected:
      'HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }) used in the features array of the lexicalEditor on the body field',
    category: 'richtext',
    fixturePath: 'richtext/codegen/add-headingfeature-h2-h3',
    // HeadingFeature argument not introspectable; fieldOption verifies editor override exists
    assertions: [{ kind: 'fieldOption', slug: 'posts', field: 'body', option: 'editor' }],
  },
  {
    input:
      'The posts collection is missing its content richText field. Add it so editors can write rich text content using the Lexical editor.',
    expected:
      'A content field of type richText added to the posts collection, with editor: lexicalEditor() (or using the root-level editor)',
    category: 'richtext',
    fixturePath: 'richtext/codegen/fix-missing-richtext-field',
    // fieldExists checks the field was added; fieldOption checks it uses the richText type
    assertions: [
      { kind: 'fieldExists', slug: 'posts', field: 'content' },
      { kind: 'fieldOption', slug: 'posts', field: 'content', option: 'type', value: 'richText' },
    ],
  },
  // ──────────────────────────────────────────────────────────
  // Correction case — broken fixture that the LLM must fix
  // ──────────────────────────────────────────────────────────
  {
    input:
      'This config has a content field on the posts collection that uses type: "text" but it should use the Lexical rich text editor. Fix it so the field is a richText field using lexicalEditor().',
    expected:
      'content field on posts changed from type: "text" to type: "richText" with an editor: lexicalEditor() property added',
    category: 'richtext',
    fixturePath: 'richtext/codegen/fix-wrong-field-type',
    assertions: [
      { kind: 'fieldOption', slug: 'posts', field: 'content', option: 'type', value: 'richText' },
      { kind: 'fieldOption', slug: 'posts', field: 'content', option: 'editor' },
    ],
  },
]
