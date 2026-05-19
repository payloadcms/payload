import type { CodegenEvalCase } from '../../types.js'

export const pluginsCodegenDataset: CodegenEvalCase[] = [
  {
    input:
      'Implement the withTimestamps plugin so that it adds a "publishedAt" date field to every collection in the config.',
    expected:
      'withTimestamps maps over config.collections spreading each collection with a new date field named publishedAt appended to the fields array; imports Config and/or Plugin from "payload"',
    category: 'plugins',
    fixturePath: 'plugins/codegen/with-timestamps',
  },
  {
    input:
      'Implement the withFeature plugin factory so that when options.enabled is false it returns the config unchanged, and when true it adds a "feature" text field to every collection.',
    expected:
      'withFeature returns the incomingConfig early when !options.enabled; otherwise maps over collections spreading each with a text field named "feature" appended to fields',
    category: 'plugins',
    fixturePath: 'plugins/codegen/enabled-option',
  },
  {
    input:
      'Implement the withInitLogging plugin so that it extends onInit to log "Plugin initialized" using payload.logger.info after any existing onInit has run.',
    expected:
      'withInitLogging assigns config.onInit to an async function, conditionally awaits incomingConfig.onInit(payload) if it exists, then calls payload.logger.info("Plugin initialized")',
    category: 'plugins',
    fixturePath: 'plugins/codegen/oninit-logging',
  },
  {
    input:
      'Implement the withTenancy plugin so that it adds a "tenant" relationship field pointing to the "tenants" collection to every collection that has auth enabled.',
    expected:
      'withTenancy filters or maps over incomingConfig.collections; for collections with a truthy auth property, spreads the collection and appends a relationship field named "tenant" with relationTo: "tenants"',
    category: 'plugins',
    fixturePath: 'plugins/codegen/tenant-relationship',
  },
]
