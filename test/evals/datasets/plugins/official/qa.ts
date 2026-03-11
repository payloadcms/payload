import type { EvalCase } from '../../../types.js'

export const pluginsOfficialQADataset: EvalCase[] = [
  {
    input: 'What are the official plugins maintained by the Payload team?',
    expected:
      'Ecommerce, Import/Export, Stripe, SEO, Sentry, Search, Redirects, Nested Docs, Multi-Tenant, MCP, and Form Builder',
    category: 'plugins',
  },
  {
    input: 'What does the Payload SEO plugin do?',
    expected:
      'adds SEO metadata fields to collections and globals, including generateTitle and generateDescription functions, and integrates with the admin UI to preview how pages appear in search results',
    category: 'plugins',
  },
  {
    input: 'What does the Payload Search plugin do?',
    expected:
      'indexes documents from specified collections into a dedicated search collection, enabling fast full-text search queries without hitting the original collections',
    category: 'plugins',
  },
  {
    input: 'What does the Payload Redirects plugin do?',
    expected:
      'adds a Redirects collection that maps source paths to destination URLs or documents, enabling editors to manage 301/302 redirects from the admin UI',
    category: 'plugins',
  },
  {
    input: 'What does the Nested Docs plugin do and what field does it add?',
    expected:
      'enables hierarchical document trees within a collection by adding a parent relationship field; generates breadcrumbs based on the ancestor chain',
    category: 'plugins',
  },
  {
    input: 'What package provides the Payload Form Builder plugin and what does it add?',
    expected:
      '@payloadcms/plugin-form-builder; adds a Forms collection for building dynamic forms with configurable fields, submissions collection, and email confirmations',
    category: 'plugins',
  },
  {
    input: 'What does the Payload Stripe plugin do?',
    expected:
      'integrates Stripe with Payload by syncing collections to Stripe resources, providing webhooks handling, and exposing Stripe REST endpoints within the Payload API',
    category: 'plugins',
  },
  {
    input: 'What does the Payload Multi-Tenant plugin do?',
    expected:
      'adds multi-tenancy support by scoping collections and data access to tenant records, allowing a single Payload instance to serve multiple isolated tenants',
    category: 'plugins',
  },
  {
    input:
      'What does the Payload MCP plugin do and how do you configure which collections an AI agent can access?',
    expected:
      'adds a Model Context Protocol server that allows AI agents to interact with Payload via MCP; configured with a collections object mapping slugs to options including an enabled property (boolean or object with find/create/update/delete booleans) and an optional description string',
    category: 'plugins',
  },
  {
    input: 'What does the Payload Import/Export plugin do?',
    expected:
      'adds the ability to export collection data to CSV or JSON format and import data back from those formats directly through the admin UI',
    category: 'plugins',
  },
  {
    input: 'What does the Payload Ecommerce plugin provide?',
    expected:
      'adds e-commerce functionality including products, orders, cart management, and payment integration to a Payload instance',
    category: 'plugins',
  },
]
