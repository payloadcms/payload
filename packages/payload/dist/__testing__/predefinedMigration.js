/**
 * Test predefined migration for testing plugin-style module specifier imports.
 * This is used in integration tests to verify that external packages (without @payloadcms/db-* prefix)
 * can export predefined migrations via their package.json exports.
 *
 * This tests the second code path in getPredefinedMigration.ts (lines 56-72)
 *
 * NOTE: This is a .js file (not .ts) because Node.js with --no-experimental-strip-types
 * cannot import .ts files via module specifiers. Absolute file paths work because Vitest's
 * loader intercepts file:// URLs, but module specifiers are resolved by Node.js first.
 */ const imports = ``;
const upSQL = `  // Test predefined migration from payload/__testing__/predefinedMigration
  payload.logger.info('Test migration UP from payload package executed')`;
const downSQL = `  // Test predefined migration DOWN from payload package
  payload.logger.info('Test migration DOWN from payload package executed')`;
export { downSQL, imports, upSQL };

//# sourceMappingURL=predefinedMigration.js.map