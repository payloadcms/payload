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
  {
    input:
      'Add the MCP plugin from "@payloadcms/plugin-mcp" to the config. Enable find and create operations for the "posts" collection, and set its description to "Blog posts for content creation".',
    expected:
      'named import { mcpPlugin } from "@payloadcms/plugin-mcp", mcpPlugin({ collections: { posts: { enabled: { find: true, create: true }, description: "Blog posts for content creation" } } }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/mcp',
  },
  {
    input:
      'Add the Multi-Tenant plugin from "@payloadcms/plugin-multi-tenant" to the config. Enable it for the "pages" collection with default options, and mark "posts" as a global (one document per tenant).',
    expected:
      'named import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant", multiTenantPlugin({ collections: { pages: {}, posts: { isGlobal: true } } }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/multi-tenant',
  },
  {
    input:
      'Add the Stripe plugin from "@payloadcms/plugin-stripe" to the config using the STRIPE_SECRET_KEY environment variable. Also enable the REST proxy endpoint.',
    expected:
      'named import { stripePlugin } from "@payloadcms/plugin-stripe", stripePlugin({ stripeSecretKey: process.env.STRIPE_SECRET_KEY, rest: true }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/stripe',
  },
  {
    input:
      'Add the Import/Export plugin from "@payloadcms/plugin-import-export" to the config, enabling it for the "posts" and "pages" collections.',
    expected:
      'named import { importExportPlugin } from "@payloadcms/plugin-import-export", importExportPlugin({ collections: ["posts", "pages"] }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/import-export',
  },
  {
    input:
      'Add the Ecommerce plugin from "@payloadcms/plugin-ecommerce" to the config. Use the "users" collection as the customer collection and provide stub access functions (each returns true) for all required access keys: adminOnlyFieldAccess, adminOrPublishedStatus, isAdmin, isAuthenticated, isCustomer, and isDocumentOwner.',
    expected:
      'named import { ecommercePlugin } from "@payloadcms/plugin-ecommerce", ecommercePlugin({ access: { adminOnlyFieldAccess: () => true, adminOrPublishedStatus: () => true, isAdmin: () => true, isAuthenticated: () => true, isCustomer: () => true, isDocumentOwner: () => true }, customers: { slug: "users" } }) added to plugins array',
    category: 'plugins',
    fixturePath: 'plugins/official/codegen/ecommerce',
  },
]
