/**
 * Test predefined migration for testing plugin-style module specifier imports.
 * This is used in integration tests to verify that external packages can export
 * predefined migrations via their package.json exports.
 */
const imports = ``
const upSQL = `  // Test predefined migration from @payloadcms/db-mongodb/__testing__
  payload.logger.info('Test migration UP executed')`
const downSQL = `  // Test predefined migration DOWN
  payload.logger.info('Test migration DOWN executed')`

export { downSQL, imports, upSQL }
