import type { CodegenEvalCase } from '../../../types.js'

export const pluginsOfficialCodegenDataset: CodegenEvalCase[] = [
  {
    input:
      'Add the SEO plugin from "@payloadcms/plugin-seo" to the config. Configure it with a generateTitle function that returns the document title followed by " | Acme".',
    expected:
      'named import { seoPlugin } from "@payloadcms/plugin-seo", seoPlugin({ generateTitle }) added to plugins array, generateTitle returns a string with the doc title and " | Acme"',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/seo',
  },
  {
    input:
      'Add the Redirects plugin from "@payloadcms/plugin-redirects" to the config. Configure it to apply to the "pages" and "posts" collections.',
    expected:
      'named import { redirectsPlugin } from "@payloadcms/plugin-redirects", redirectsPlugin({ collections: ["pages", "posts"] }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/redirects',
  },
  {
    input:
      'Add the Nested Docs plugin from "@payloadcms/plugin-nested-docs" to the config for the "pages" collection, generating breadcrumbs with a label from the "title" field.',
    expected:
      'named import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs", nestedDocsPlugin({ collections: ["pages"], generateLabel: (_, doc) => doc.title }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/nested-docs',
  },
  {
    input:
      'Add the Search plugin from "@payloadcms/plugin-search" to the config, indexing the "posts" and "pages" collections.',
    expected:
      'named import { searchPlugin } from "@payloadcms/plugin-search", searchPlugin({ collections: ["posts", "pages"] }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/search',
  },
  {
    input:
      'Add the Form Builder plugin from "@payloadcms/plugin-form-builder" to the config with a redirectRelationships option pointing to the "pages" collection.',
    expected:
      'named import { formBuilderPlugin } from "@payloadcms/plugin-form-builder", formBuilderPlugin({ redirectRelationships: ["pages"] }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/form-builder',
  },
  {
    input:
      'Add the Sentry plugin from "@payloadcms/plugin-sentry" to the config. The plugin accepts a Sentry instance via the Sentry option and optional captureErrors array via options.captureErrors.',
    expected:
      'named import { sentryPlugin } from "@payloadcms/plugin-sentry", sentryPlugin({ Sentry }) added to plugins array where Sentry is a Sentry instance import',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/sentry',
  },
]
